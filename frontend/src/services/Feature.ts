import { noRedirectClient, UnauthenticatedError } from './apiClient';
import ObservableService from './observableService';

export interface FeatureState {
  CALL_LIMITS: boolean;
  WORKPASS_VALIDATION: boolean;
}

const featureEndpoint = '/features';

export default class FeatureService extends ObservableService<FeatureState> {
  constructor() {
    super();
    this.state = {
      CALL_LIMITS: true,
      WORKPASS_VALIDATION: false,
    };
  }

  async refreshFeatures(): Promise<FeatureState> {
    try {
      const features = (await noRedirectClient.get(
        `${featureEndpoint}/`
      )) as FeatureState;
      this.state = features;
      this.notify();
      return this.state;
    } catch (e) {
      if (e instanceof UnauthenticatedError) {
        return this.state;
      }
      throw e;
    }
  }
}
