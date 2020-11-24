import * as Sentry from '@sentry/react';
import { Device } from 'twilio-client';
import { getLogger } from 'loglevel';
import getToken from './CallToken';

// TODO handle production environments better
const isProd = true;
const twilioLogger = getLogger(Device.packageName);
twilioLogger.setLevel('trace');

const CALL_RETRY_COUNT = 3;
const TransientIssueErrorCodes = new Set([
  // These have been confirmed by Twilio support to be caused by network issues.
  31003, // This happens when the connection is canceled e.g. by navigation
  31005, // Appears to be a transient issue when connecting to Twilio
  31009, // 'Transport not available -> the device seems to randomly error out'

  // These are from our own observation.
  // 31002, // Authentication in progress. Twilio support says that this may be due to errors in the backend, we should investigate this further.
  31204, // Unable to validate token -> is the token invalid? dk if this is a problem or not. Probably only solved by destroying the device
  31205, // JWT expires. Not an issue, we will refresh it anyway.
]);

// Helper functions for performing Twilio calls. The goal of this is to abstract over some of the minor details of interacting with the Twilio device.
// This assumes that there is only one global device.

const SETUP_OPTIONS = {
  enableIceRestart: true,
  enableRingingState: true,
};

function isTransientIssue(error) {
  const { code } = error;
  if (TransientIssueErrorCodes.has(code)) {
    return true;
  }
  if (code === 31000 && error.message === 'Call is no longer valid') {
    return true;
  }
  return false;
}

async function makeCallOnce(call) {
  if (!isProd) {
    return null;
  }

  const device = new Device();
  const token = await getToken();
  device.setup(token, SETUP_OPTIONS);

  return new Promise((resolve, reject) => {
    if (device.status() === 'ready') {
      const connection = device.connect(call);
      resolve({ device, connection });
      return;
    }

    // I thought I was free from callback hell.
    const callWhenReady = () => {
      const connection = device.connect(call);
      Sentry.addBreadcrumb({
        category: 'twilio',
        data: {
          twilioConnection: connection,
        },
      });
      connection.on('ringing', () => resolve({ device, connection }));
    };

    // Could it be that the device is ready before the listener is attached?
    // Is this insane??
    device.once('ready', callWhenReady);
    device.once('error', reject);
  });
}

async function makeCall(call) {
  let lastError;

  for (let i = 0; i < CALL_RETRY_COUNT; i += 1) {
    try {
      console.log('attempting call', i + 1);
      // eslint-disable-next-line
      return await makeCallOnce(call);
    } catch (error) {
      if (!error.code || !TransientIssueErrorCodes.has(error.code)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

export { makeCall, isTransientIssue };
