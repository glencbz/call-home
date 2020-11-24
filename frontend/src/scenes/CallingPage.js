import React, { useCallback, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import CallEndIcon from '@material-ui/icons/CallEnd';
import CloseIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { DateTime } from 'luxon';
import { Redirect } from 'react-router-dom';
import { useUserService, useContactService } from '../contexts';
import PATHS from './paths';
import Container from '../components/shared/Container';
import DetectBrowserSnackbar from '../components/shared/DetectBrowserSnackbar';
import { makeCall, isTransientIssue } from '../services/TwilioCall';
import { formatCallTime } from '../util/timeFormatters';
import { SceneProps } from './types';

const EN_STRINGS = {
  CALLING_CONNECTING: 'Connecting...',
  CALLING_CONNECTED: 'Connected!',
  CALLING_CALL_FAILED: 'Call failed',
  CALLING_CALL_FINISHED: 'Call complete!',
  CALLING_NEED_MICROPHONE_ACCESS_MESSAGE:
    'Unable to make the call because the app does not have permissions to use your microphone. Please change your browser settings to allow us to use your microphone.',
  CALLING_TRANSIENT_ISSUE_MESSAGE:
    "We've experienced a temporary issue, please try again.",
  CALLING_UNSUPPORTED_BROWSER_MESSAGE:
    'Your browser is not supported. Try using Chrome or Safari',
};

const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    CALLING_CONNECTING: 'সংযোজক',
    CALLING_CONNECTED: 'সংযুক্ত', // TODO Google translate
    CALLING_CALL_FAILED: 'কল ব্যর্থ হয়েছে',
  },
};

const CallEndButton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.error.main,
    height: '5em',
    width: '5em',
    borderRadius: '1000px',
    color: 'white',
  },
}))(Button);

const USER_ACTIONABLE_TWILIO_ERROR_CODE_TO_ACTION_MESSAGE = {
  31002: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31003: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31005: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31009: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31204: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31205: 'CALLING_TRANSIENT_ISSUE_MESSAGE',
  31208: 'CALLING_NEED_MICROPHONE_ACCESS_MESSAGE',
};

function subscribeToOptionalDevice(device, eventName, listener) {
  if (device) {
    device.on(eventName, listener);
  }
  return () => {
    if (!device) {
      return;
    }

    try {
      device.removeListener(eventName, listener);
    } catch (error) {
      Sentry.captureException(error);
    }
  };
}

export default function CallingPage({ locale, routePath }) {
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectTime, setConnectTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  const [wasCallSuccessful, setWasCallSuccessful] = useState(false);
  const [hasUserDisconnected, setHasUserDisconnected] = useState(false);
  const [activeConnection, setActiveConnection] = useState(null);
  const [device, setDevice] = useState(null);
  const [lastErrorMessage, setLastErrorMessage] = useState(null);
  const [userState] = useUserService();
  const { me: user } = userState;
  const [contactState, contactService] = useContactService();
  const { activeContact } = contactState;

  const handleStatusChange = useCallback(() => {
    if (!device) {
      return;
    }
    const status = device.status();
    if (status === 'busy') {
      setIsConnected(true);
      setConnectTime(DateTime.local());
      setWasCallSuccessful(true);
    } else {
      setIsConnected(false);
    }
  }, [device, setIsConnected]);

  const subscribeToDeviceStatusEvent = useCallback(
    (eventName) => {
      const listener = () => {
        console.log(eventName);
        handleStatusChange();
      };
      return subscribeToOptionalDevice(device, eventName, listener);
    },
    [device, handleStatusChange]
  );

  useEffect(() => {
    return subscribeToDeviceStatusEvent('connect');
  }, [subscribeToDeviceStatusEvent]);

  useEffect(() => {
    return subscribeToDeviceStatusEvent('disconnect');
  }, [subscribeToDeviceStatusEvent]);

  useEffect(() => {
    return subscribeToDeviceStatusEvent('offline');
  }, [subscribeToDeviceStatusEvent]);

  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }
    const interval = setInterval(() => setCurrentTime(DateTime.local()), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Errors don't seem to always correspond to status changes. We can capture these and if the calls 'fail' (however we detect that), we present messages to the user.
  useEffect(() => {
    const listener = (error) => {
      console.log('ERRRORRRR');
      console.log(error);

      // Comment in if there is any doubt about whether events are being surfaced
      // Sentry.captureMessage(`Error smoke test`);
      if (isTransientIssue(error)) {
        return;
      }
      if (
        error.code &&
        error.code in USER_ACTIONABLE_TWILIO_ERROR_CODE_TO_ACTION_MESSAGE
      ) {
        setLastErrorMessage(
          STRINGS[locale][
            USER_ACTIONABLE_TWILIO_ERROR_CODE_TO_ACTION_MESSAGE[error.code]
          ]
        );
        return;
      }
      setLastErrorMessage(`${error.message}, (${error.code})`);
      Sentry.withScope((scope) => {
        try {
          scope.setExtra('errorBody', JSON.stringify(error, null, 2));
        } finally {
          Sentry.captureEvent(error);
        }
      });
    };
    return subscribeToOptionalDevice(device, 'error', listener);
  }, [setLastErrorMessage, device]);

  useEffect(() => {
    (async () => {
      if (!activeContact) {
        return;
      }
      try {
        setHasAttemptedConnection(true);
        // TODO we can perform more sophisticated things with this connection like subscribe to updates
        const { device: newDevice, connection } = await makeCall({
          userId: user.id,
          contactId: activeContact.id,
        });
        setActiveConnection(connection);
        setDevice(newDevice);
      } catch (error) {
        if (device && !device.isSupported) {
          setLastErrorMessage(
            STRINGS[locale].CALLING_UNSUPPORTED_BROWSER_MESSAGE
          );
        } else if (
          error.code &&
          error.code in USER_ACTIONABLE_TWILIO_ERROR_CODE_TO_ACTION_MESSAGE
        ) {
          setLastErrorMessage(
            STRINGS[locale][
              USER_ACTIONABLE_TWILIO_ERROR_CODE_TO_ACTION_MESSAGE[error.code]
            ]
          );
        } else {
          Sentry.withScope((scope) => {
            try {
              scope.setExtra('errorBody', JSON.stringify(error, null, 2));
            } finally {
              Sentry.captureEvent(error);
            }
          });
          setLastErrorMessage(`${error.message}, (${error.code})`);
        }
      }
    })();
  }, [user, activeContact]);

  const disconnectCall = useCallback(() => {
    if (activeConnection) {
      activeConnection.disconnect();
    }
    setHasUserDisconnected(true);
  }, [activeConnection]);

  const exitCallingPage = useCallback(() => {
    disconnectCall();
    contactService.setActiveContact(null);
  }, [contactService, disconnectCall]);

  if (!user) {
    return <Redirect to={PATHS.LOGIN} />;
  }
  if (!activeContact) {
    return <Redirect to={PATHS.CONTACTS} />;
  }

  const avatarUrl = `/images/avatars/${activeContact.avatar}.svg`;

  let callDuration = null;
  if (currentTime && connectTime) {
    callDuration = currentTime.diff(connectTime);
  }

  let connectionMessage;
  if (isConnected) {
    connectionMessage = callDuration ? '' : STRINGS[locale].CALLING_CONNECTED;
  } else if (hasUserDisconnected) {
    connectionMessage = STRINGS[locale].CALLING_CALL_FINISHED;
  } else {
    connectionMessage = STRINGS[locale].CALLING_CONNECTING;
  }

  const DisconnectCallButton = (
    <CallEndButton variant="contained" onClick={disconnectCall}>
      <CallEndIcon />
    </CallEndButton>
  );

  const ExitPageButton = (
    <CallEndButton variant="contained" onClick={exitCallingPage}>
      <CloseIcon />
    </CallEndButton>
  );

  return (
    <Container>
      <DetectBrowserSnackbar />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            marginTop: '20%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <img
            style={{ height: '16rem', width: '16rem' }}
            alt=""
            src={avatarUrl}
          />
          <Typography style={{ marginTop: '4rem' }} variant="h5" component="h2">
            {activeContact.name}
          </Typography>
          {callDuration && (
            <Typography variant="body1">
              {formatCallTime(callDuration)}
            </Typography>
          )}
          <Typography variant="body1">{connectionMessage}</Typography>
          {hasAttemptedConnection && lastErrorMessage && !wasCallSuccessful ? (
            <Typography variant="body1" color="error">
              There was an error. Please send a screenshot with this message:
              {lastErrorMessage}
            </Typography>
          ) : null}
        </div>
        {isConnected ? DisconnectCallButton : ExitPageButton}
      </div>
    </Container>
  );
}
