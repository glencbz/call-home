import { logger } from '../config';
import { TwilioCall } from '../services';
import refreshConnectedCalls from './refreshConnectedCalls';
import refreshJoinedCalls from './refreshJoinedCalls';

logger.info('Initializing jobs');

refreshConnectedCalls(TwilioCall);
refreshJoinedCalls();
