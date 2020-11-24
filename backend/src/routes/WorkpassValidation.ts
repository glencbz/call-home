import express, { Router } from 'express';
import * as z from 'zod';
import type { WorkpassValidation } from '../services';
import { validateRequest } from './helpers/validation';

const POST_SCHEMA = z.object({
  body: z.object({
    serialNumber: z.string(),
  }),
});

function WorkpassValidationRoutes(
  workpassValidation: typeof WorkpassValidation
): Router {
  const router = express.Router();

  router.post(
    '/',
    validateRequest(POST_SCHEMA, async (parsedReq, res, req) => {
      const { serialNumber } = parsedReq.body;
      const { user } = req;

      const validationResult = await workpassValidation.validateUser(
        user.id,
        serialNumber
      );

      if (validationResult.result === 'success') {
        return res.status(200).send();
      }

      return res.status(400).json(validationResult);
    })
  );

  return router;
}

export default WorkpassValidationRoutes;
