import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import { logger } from '../config';
import { sanitizeDbErrors } from './lib';
import { shouldEnableCallLimits } from './Feature';
import type { Call as CallEntity } from '../models';
import type { Contact, Wallet, User, UserValidation } from '.';

// TODO this isn't really used
const callAggregationPeriod = 'month';

function CallService(
  CallModel: typeof CallEntity,
  userService: typeof User,
  contactService: typeof Contact,
  userValidationService: typeof UserValidation,
  walletService: typeof Wallet
) {
  async function checkWalletBalance(userId: number) {
    const wallet = await walletService.getWalletForUser(userId);
    if (!wallet) {
      const msg = `Wallet not found for userId ${userId}`;
      logger.error(msg);
      throw new Error(msg);
    }
    logger.info('Wallet call time is %s', wallet.callTime);
    if (wallet.callTime <= 0) {
      throw new Error('Validation Error: INSUFFICIENT_CALL_TIME');
    }
  }

  // TODO This is actually wrong, we should be authorizing the token, not the call
  async function validateCall(userId: number, contactId: number) {
    const user = await userService.getUser(userId);
    if (!user) {
      throw new Error(`Authorization error for user ${userId}`);
    }

    const isUserVerified = await userValidationService.isUserVerified(userId);
    logger.info('Is user verified? %s', isUserVerified);
    if (!isUserVerified) {
      throw new Error(`Authorization error for user ${userId}`);
    }

    if (shouldEnableCallLimits(userId)) {
      await checkWalletBalance(userId);
    }

    const userContacts = await contactService.listContactsByUserId(userId);

    if (
      userContacts.findIndex(
        (contact: CallEntity) => contact.id === contactId
      ) < 0
    ) {
      logger.warn(
        'Authorization failed for userId %s and contactId %s',
        userId,
        contactId
      );
      throw new Error(`Authorization error for user ${userId}`);
    }
    return true;
  }

  async function createCall({
    userId,
    contactId,
    incomingTwilioCallSid,
  }: Pick<CallEntity, 'userId' | 'contactId' | 'incomingTwilioCallSid'>) {
    await validateCall(userId, contactId);
    const contact = await contactService.getContact(userId, contactId);
    const call = {
      phoneNumber: contact.phoneNumber,
      contactId,
      userId,
      incomingTwilioCallSid,
    };
    return sanitizeDbErrors(() => CallModel.create(call));
  }

  async function getUserCallsForPeriod(userId: number): Promise<CallEntity[]> {
    const startDate: Date = DateTime.local()
      .startOf(callAggregationPeriod)
      .toJSDate();
    return CallModel.findAll({
      where: {
        [Op.and]: {
          userId,
          createdAt: {
            [Op.gte]: startDate,
          },
        },
      },
    });
  }

  async function getCallByIncomingSid(incomingTwilioCallSid: string) {
    return CallModel.findOne({
      where: {
        incomingTwilioCallSid,
      },
    });
  }

  async function listRecentCallsByUserId(userId: number) {
    return CallModel.findAll({
      where: {
        userId,
      },
    });
  }

  return {
    createCall,
    getUserCallsForPeriod,
    getCallByIncomingSid,
    listRecentCallsByUserId,
  };
}

export default CallService;
