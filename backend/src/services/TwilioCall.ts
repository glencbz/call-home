import { Op } from 'sequelize';
import { sanitizeDbErrors, TypedEventEmitter } from './lib';
import { logger } from '../config';
import type { TwilioCall as TwilioCallEntity } from '../models';
import type { TwilioClient } from './index';
import type CallService from './Call';
import type TransactionService from './Transaction';

export type TwilioCallServiceEvent = 'twilio-call-updated';
export interface TwilioCallUpdatedPayload {
  type: 'twilio-call-updated';
  twilioCall: TwilioCallEntity;
}
export type TwilioCallServicePayload = TwilioCallUpdatedPayload;

class TwilioCallService extends TypedEventEmitter<
  TwilioCallServiceEvent,
  TwilioCallServicePayload
> {
  twilioCallModel: typeof TwilioCallEntity;

  twilioClient: typeof TwilioClient;

  callService: ReturnType<typeof CallService>;

  transactionService: TransactionService;

  constructor(
    twilioCallModel: typeof TwilioCallEntity,
    twilioClient: typeof TwilioClient,
    callService: ReturnType<typeof CallService>,
    transactionService: TransactionService
  ) {
    super();
    this.twilioCallModel = twilioCallModel;
    this.twilioClient = twilioClient;
    this.callService = callService;
    this.transactionService = transactionService;
  }

  createTwilioCall = async (twilioCall: Partial<TwilioCallEntity>) => {
    return sanitizeDbErrors(() => this.twilioCallModel.create(twilioCall));
  };

  updateTwilioCall = async (
    twilioCallId: number,
    twilioCall: Partial<TwilioCallEntity>
  ) => {
    return this.twilioCallModel.update(
      {
        ...twilioCall,
        lastUpdated: new Date(),
      },
      {
        where: {
          id: twilioCallId,
        },
      }
    );
  };

  getTwilioCallBySid = async (twilioSid: string) => {
    return this.twilioCallModel.findOne({
      where: {
        twilioSid,
      },
    });
  };

  listTwilioCallsBySids = async (twilioSids: string[]) => {
    return this.twilioCallModel.findAll({
      where: {
        twilioSid: twilioSids,
      },
    });
  };

  getTwilioCallByParentSid = async (parentCallSid: string) => {
    return this.twilioCallModel.findOne({
      where: {
        parentCallSid,
      },
    });
  };

  getPendingCallsOrderByLastUpdated = async () => {
    return this.twilioCallModel.findAll({
      // Add an arbitrary limit just in case
      limit: 100,
      where: {
        status: {
          [Op.or]: {
            [Op.in]: [
              '',
              'in-progress',
              'ringing',
              'queued',
              'x-parent-completed',
            ],
            [Op.is]: null,
          },
        },
      },
      order: [['lastUpdated', 'ASC']],
    });
  };

  getCallsMissingDuration = async () => {
    return this.twilioCallModel.findAll({
      // Add an arbitrary limit just in case
      limit: 100,
      where: {
        status: 'completed',
        duration: null,
      },
      order: [['lastUpdated', 'ASC']],
    });
  };

  createTransactionForTwilioCall = async (twilioCall: TwilioCallEntity) => {
    logger.info('Creating transaction for twilio call %s', twilioCall);
    const callEntity = await this.callService.getCallByIncomingSid(
      twilioCall.parentCallSid
    );
    if (!callEntity) {
      const msg = `callEntity not found for parentCallSid ${twilioCall.parentCallSid}`;
      logger.error(msg);
      throw new Error(msg);
    }
    return this.transactionService.createTransaction({
      reference: 'call',
      userId: callEntity.userId,
      amount: -twilioCall.duration,
    });
  };

  // Collects the business logic for updating twilio calls by calling the Twilio API.
  // Used in two places: the status callback and the pending calls poller
  fetchTwilioDataForTwilioCall = async (twilioCall: TwilioCallEntity) => {
    logger.info('fetchTwilioDataForTwilioCall -> Updating call', twilioCall.id);
    const { parentCallSid } = twilioCall;
    const [twilioResponseCalls, twilioParentCall] = await Promise.all([
      this.twilioClient.getCallsByIncomingSid(parentCallSid),
      this.twilioClient.getCall(parentCallSid),
    ]);
    if (twilioParentCall.status === 'canceled') {
      await this.updateTwilioCall(twilioCall.id, {
        status: 'x-parent-canceled',
      });
      return;
    }
    if (twilioResponseCalls.length === 1) {
      const [twilioResponseCall] = twilioResponseCalls;
      const {
        sid: twilioSid,
        from: fromPhoneNumber,
        to: toPhoneNumber,
        duration,
        status,
        price,
        priceUnit,
      } = twilioResponseCall;
      await this.updateTwilioCall(twilioCall.id, {
        twilioSid,
        fromPhoneNumber,
        toPhoneNumber,
        status,
        price,
        priceUnit,
        duration: Number(duration),
      });
      await twilioCall.reload();
      // TODO seems like it might be possible to create duplicate transactions, there should be a way to protect against this.
      this.createTransactionForTwilioCall(twilioCall);
      return;
    }
    if (twilioParentCall.status === 'completed') {
      // It is possible for the parent call to complete without the child call happening
      // e.g. an error occurs.
      await this.updateTwilioCall(twilioCall.id, {
        status: 'x-not-initiated',
      });
      return;
    }
    logger.error(
      'Expected exactly one child call for parent SID. This is a potential error. SID: ',
      twilioCall.parentCallSid
    );
  };

  fetchTwilioDataForTwilioParentSid = async (parentCallSid: string) => {
    logger.info('fetchTwilioDataForTwilioParentSid -> %s', parentCallSid);
    const twilioCall = await this.getTwilioCallByParentSid(parentCallSid);
    if (!twilioCall) {
      const msg = `twilioCall not found for parentCallSid ${parentCallSid}`;
      logger.error(msg);
      throw new Error(msg);
    }
    await this.fetchTwilioDataForTwilioCall(twilioCall);
    logger.info(
      'fetchTwilioDataForTwilioParentSid completed -> %s',
      parentCallSid
    );
  };

  fetchTwilioDataForPendingTwilioCalls = async () => {
    logger.info('fetchTwilioDataForPendingTwilioCalls');
    const twilioCalls = await this.getPendingCallsOrderByLastUpdated();
    await Promise.all(twilioCalls.map(this.fetchTwilioDataForTwilioCall));
    logger.info('fetchTwilioDataForPendingTwilioCalls completed');
  };
}

export { TwilioCallService };
export default TwilioCallService;
