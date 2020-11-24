import express, { Router } from 'express';
import * as z from 'zod';
import _ from 'lodash';
import { requireSelf } from './middlewares';
import type {
  Call as CallService,
  TwilioCall as TwilioCallService,
  Contact as ContactService,
} from '../services';
import Stopwatch from '../util/stopwatch';
import {
  validateRequest,
  stringToNumberTransformer,
} from './helpers/validation';
import { Call, Contact } from '../models';
import TwilioCall from '../models/TwilioCall';

const GET_SCHEMA = z.object({
  params: z.object({
    userId: stringToNumberTransformer,
  }),
});

const GET_RECENT_SCHEMA = z.object({
  params: z.object({
    userId: stringToNumberTransformer,
  }),
});

function mapObjectsToRecentCallResponse(
  calls: Call[],
  contacts: Contact[],
  twilioCalls: TwilioCall[]
) {
  return calls.map((call) => {
    const currentContact = contacts.find(
      (contact) => contact.id === call.contactId
    );
    const currentTwilioCall = twilioCalls.find(
      (twilioCall) => twilioCall.twilioSid === call.incomingTwilioCallSid
    );
    return {
      id: call.id,
      avatar: _.get(currentContact, 'avatar', null),
      name: _.get(currentContact, 'name', null),
      phoneNumber: call.phoneNumber,
      startTime: call.createdAt.toISOString(),
      duration: _.get(currentTwilioCall, 'duration', null),
    };
  });
}

function CallRoutes(
  callService: typeof CallService,
  twilioCallService: typeof TwilioCallService,
  contactService: typeof ContactService
): Router {
  const router = express.Router();

  router.get(
    '/:userId/calls/recent',
    requireSelf,
    validateRequest(GET_RECENT_SCHEMA, async (parsedReq, res, req) => {
      const { userId } = parsedReq.params;
      const recentCalls = await callService.listRecentCallsByUserId(userId);
      const contactIds = _.chain(recentCalls)
        .map((contact) => contact.contactId)
        .uniq();
      const contacts = <Contact[]>(
        await contactService.listContactsFromIds(contactIds)
      );
      const twilioCallSids = recentCalls.map(
        (call) => call.incomingTwilioCallSid
      );
      const twilioCalls = await twilioCallService.listTwilioCallsBySids(
        twilioCallSids
      );

      return res
        .status(200)
        .json(
          mapObjectsToRecentCallResponse(recentCalls, contacts, twilioCalls)
        );
    })
  );

  router.get(
    '/:userId/calls/call-summary',
    requireSelf,
    validateRequest(GET_SCHEMA, async (parsedReq, res, req) => {
      const { userId } = parsedReq.params;
      const stopwatch = new Stopwatch();
      stopwatch.start();
      const userCalls = await callService.getUserCallsForPeriod(userId);
      const twilioCalls = await Promise.all(
        userCalls.map((call) =>
          twilioCallService.getTwilioCallByParentSid(call.incomingTwilioCallSid)
        )
      );
      const totalDurationSeconds = twilioCalls
        .map((twilioCall) => {
          if (!twilioCall) {
            return 0;
          }
          return twilioCall.duration;
        })
        .reduce((acc, curr) => acc + curr, 0);
      stopwatch.stop();
      req.log.info(
        'Calculating summary for user %s took %s millis',
        userId,
        stopwatch.millisTaken
      );
      res.send(String(totalDurationSeconds));
    })
  );

  return router;
}

export default CallRoutes;
