import React, { useCallback, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Color } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { useUserService } from '../contexts';
import Container from '../components/shared/Container';
import { PrimaryButton } from '../components/shared/RoundedButton';
import { useRouting } from './paths';
import { ApiValidationError } from '../services/apiClient';
import { validateWorkpass } from '../services/WorkpassValidation';
import { Locale, SceneProps } from './types';
import './VerifyWorkpass.css';

const EN_STRINGS = {
  VERIFY_WORKPASS_TITLE: 'Enter your Work Pass serial number',
  VERIFY_WORKPASS_WORKPASS_SN_PLACEHOLDER: 'e.g. L012345',
  VERIFY_WORKPASS_HELP:
    'We need this to verify you’re a foreign worker in Singapore. ',
  VERIFY_WORKPASS_FIND_SN_HELP: 'How do I find my serial number?',
  VERIFY_WORKPASS_FINLIKE_SN_MESSAGE: 'Enter your Serial Number, not FIN',
  VERIFY_WORKPASS_INVALID_SN_MESSAGE: 'Not a valid serial number. Try again',
  VERIFY_WORKPASS_UNKNOWN_SN_MESSAGE: 'An unknown error has occurred',
  VERIFY_WORKPASS_CONFLICTING_SN_MESSAGE:
    'This serial number is already being used by somebody',
  VERIFY_WORKPASS_INVALID_API_SN_MESSAGE:
    'Unable to look up serial number. Check that your serial number is correct',
  VERIFY_WORKPASS_EXPIRED_SN_MESSAGE:
    'The work pass has expired. Try a more recent work pass',
  NEXT: 'Next',
};
const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
  },
};

const WP_SERIAL_NUMBER_REGEX = /[A-Z][0-9]+/;
const FIN_REGEX = /[A-Z][0-9]+[A-Z]/;

interface VerifyWorkpassPresenterProps {
  locale: Locale;
  wpSerialNumber: string;
  onSubmit: (event: React.FormEvent) => void;
  onWpSerialNumberChanged: (event: React.ChangeEvent<HTMLInputElement>) => void;
  errorMessage?: string;
}

function VerifyWorkpassPresenter({
  locale,
  wpSerialNumber,
  onSubmit,
  onWpSerialNumberChanged,
  errorMessage,
}: VerifyWorkpassPresenterProps) {
  const theme = useTheme();
  const [isSnImageOpened, setIsSnImageOpened] = useState(true);

  const toggleIsSnImageOpened = useCallback(() => {
    setIsSnImageOpened(!isSnImageOpened);
  }, [isSnImageOpened, setIsSnImageOpened]);

  return (
    <Container>
      <form
        onSubmit={onSubmit}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Typography
          variant="h5"
          component="h1"
          style={{ marginBottom: '12px' }}
        >
          {STRINGS[locale].VERIFY_WORKPASS_TITLE}
        </Typography>
        <Typography>{STRINGS[locale].VERIFY_WORKPASS_HELP}</Typography>
        <TextField
          fullWidth
          autoFocus
          error={Boolean(errorMessage)}
          placeholder={STRINGS[locale].VERIFY_WORKPASS_WORKPASS_SN_PLACEHOLDER}
          value={wpSerialNumber}
          variant="outlined"
          onChange={onWpSerialNumberChanged}
          helperText={errorMessage || ' '}
          style={{
            marginBottom: '12px',
          }}
        />
        <Typography
          role="button"
          onClick={toggleIsSnImageOpened}
          style={{
            textAlign: 'center',
            textDecoration: 'underline',
            color: (theme.palette.primary as any)[800],
            cursor: 'pointer',
            marginTop: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {STRINGS[locale].VERIFY_WORKPASS_FIND_SN_HELP}{' '}
          <ExpandMoreIcon
            className={`serial-number-expand ${
              isSnImageOpened ? 'serial-number-expand-expanded' : ''
            }`}
          />
        </Typography>
        {isSnImageOpened ? <img alt="" src="/images/work_pass.svg" /> : null}
        <PrimaryButton
          disableFocusRipple
          color="primary"
          type="submit"
          value="submit"
          style={{
            marginTop: 'auto',
          }}
        >
          {STRINGS[locale].NEXT}
        </PrimaryButton>
      </form>
    </Container>
  );
}

export default function VerifyWorkpass({ locale, routePath }: SceneProps) {
  const routeResult = useRouting(routePath);
  const [, userService] = useUserService();

  const [wpSerialNumber, setWpSerialNumber] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const isValidSerialNumber = Boolean(
    wpSerialNumber.match(WP_SERIAL_NUMBER_REGEX)
  );
  const isSerialNumberFINLike = Boolean(wpSerialNumber.match(FIN_REGEX));

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsTouched(true);
      if (isValidSerialNumber) {
        try {
          setApiErrorMessage(' ');
          await validateWorkpass(wpSerialNumber);
          await userService?.refreshSelf();
        } catch (error) {
          if (!error.data) {
            setApiErrorMessage(
              STRINGS[locale].VERIFY_WORKPASS_UNKNOWN_SN_MESSAGE
            );
          } else if (error.data.reason?.code === 'conflict') {
            setApiErrorMessage(
              STRINGS[locale].VERIFY_WORKPASS_CONFLICTING_SN_MESSAGE
            );
          } else if (error.data.reason?.code === 'expired') {
            setApiErrorMessage(
              STRINGS[locale].VERIFY_WORKPASS_EXPIRED_SN_MESSAGE
            );
          } else if (error.data.reason?.code === 'error') {
            setApiErrorMessage(
              STRINGS[locale].VERIFY_WORKPASS_INVALID_API_SN_MESSAGE
            );
          } else {
            setApiErrorMessage(
              STRINGS[locale].VERIFY_WORKPASS_UNKNOWN_SN_MESSAGE
            );
          }
        }
      }
    },
    [isValidSerialNumber, validateWorkpass, wpSerialNumber, userService]
  );

  const onWpSerialNumberChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsTouched(true);
      setWpSerialNumber(event.target.value);
    },
    [setIsTouched, setWpSerialNumber]
  );

  if (routeResult.shouldRender) {
    return routeResult.renderElement;
  }

  let errorMessage;
  if (apiErrorMessage) {
    errorMessage = apiErrorMessage;
  } else if (!isTouched) {
    errorMessage = undefined;
  } else if (isSerialNumberFINLike) {
    errorMessage = STRINGS[locale].VERIFY_WORKPASS_FINLIKE_SN_MESSAGE;
  } else if (!isValidSerialNumber) {
    errorMessage = STRINGS[locale].VERIFY_WORKPASS_INVALID_SN_MESSAGE;
  } else {
    errorMessage = undefined;
  }

  return (
    <VerifyWorkpassPresenter
      {...{
        onSubmit,
        onWpSerialNumberChanged,
        locale,
        wpSerialNumber,
        setWpSerialNumber,
        errorMessage,
      }}
    />
  );
}
