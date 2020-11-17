import express, { Router } from 'express';
import * as z from 'zod';
import { requireSelf } from './middlewares';
import type {
  Call as CallService,
  TwilioCall as TwilioCallService,
} from '../services';
import Stopwatch from '../util/stopwatch';
import {
  validateRequest,
  stringToNumberTransformer,
} from './helpers/validation';

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

function CallRoutes(
  callService: typeof CallService,
  twilioCallService: typeof TwilioCallService
): Router {
  const router = express.Router();

  router.get(
    '/:userId/calls/recent',
    requireSelf,
    validateRequest(GET_RECENT_SCHEMA, async (parsedReq, res, req) => {
      const { userId } = parsedReq.params;
      const recentCalls = await callService.listRecentCallsByUserId(userId);
      // recentCalls[0].createdAt;
      return res.status(200).json(recentCalls);
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
