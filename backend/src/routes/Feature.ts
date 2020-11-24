import express from 'express';
import { UserInjectedRequest } from './middlewares';
import type { Feature } from '../services';

function FeaturesRoutes(featureService: typeof Feature) {
  const router = express.Router();

  router.get('/', async (req: UserInjectedRequest, res) => {
    const userId = req.user.id;
    const features = {
      CALL_LIMITS: featureService.shouldEnableCallLimits(userId),
      WORKPASS_VALIDATION: featureService.shouldEnableWorkpassValidation(
        userId
      ),
    };
    return res.status(200).json(features);
  });

  return router;
}

export default FeaturesRoutes;
