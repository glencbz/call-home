import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ContainerWrong from '../components/shared/Container';
import { useFeatureService, useUserService } from '../contexts';
import RoundedButton, {
  PrimaryButton,
} from '../components/shared/RoundedButton';
import { beginPhoneNumberValidation, login } from '../services/Auth';
import PATHS from './paths';
import { SceneProps } from './types';

const Container: React.FunctionComponent<any> = ContainerWrong;

// TODO figure out where to put these later
const EN_STRINGS = {
  VERIFY_PHONE_NUMBER_VERIFICATION_TITLE:
    'Enter the verification code sent to {phoneNumber}',
  VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE: 'Wrong code',
  VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL: 'Verfication code',
  VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL: 'Resend code',
  VERIFY_PHONE_NUMBER_SUBMIT_LABEL: 'Submit',
  VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE:
    // TODO park this here while we figure out localization
    'দুঃখিত, আপনার ফোন নম্বরটি এখনও এই অ্যাপটিতে যুক্ত করা হয়নি। যোগদানের জন্য, নিজেকে এই ওয়েটলিস্টে যুক্ত করুন: https://callhome.sg/join-our-waitlist/', // Sorry, your phone number has not yet been added to this app. To join, add yourself to this waitlist: https://callhome.sg/join-our-waitlist/
};
const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    VERIFY_PHONE_NUMBER_VERIFICATION_TITLE:
      'আপনার মোবাইল নাম্বারে প্রেরিত কোডটি প্রবেশ করান ({phoneNumber})',
    VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE: 'ভুল কোড',
    VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL: 'যাচাইকরণ কোড', // Google translate
    VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL: 'পুনরায় পাঠানো কোড', // Google translate
    VERIFY_PHONE_NUMBER_SUBMIT_LABEL: 'জমা দিন', // Google translate
    /* VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE:
     *   ' Sorry, your phone number is not part of this programme. If you believe this is an error, reach out to an administrator.', */
  },
};

// TODO replace with better parsing like moment.js
function formatRateLimitExpiry(rateLimitExpiryMillis: number) {
  const totalSeconds = Math.round(rateLimitExpiryMillis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = (totalSeconds - seconds) / 60;
  return `${minutes}:${seconds}`;
}

export default function VerificationPhoneNumberCode({ locale }: SceneProps) {
  const [userState, userService] = useUserService();
  const { me: user, verificationPhoneNumber: phoneNumber } = userState || {};
  const [featureState, featureService] = useFeatureService();
  const [code, setCode] = useState('');
  const [hasBadOtpError, setHasBadOtpError] = useState(false);
  const [hasAllowlistError, setHasAllowlistError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rateLimitExpiry, setRateLimitExpiry] = useState(new Date());

  useEffect(() => {
    if (userService) {
      (userService as any).refreshSelf();
    }
  }, [userService]);

  useEffect(() => {
    if (featureService) {
      featureService.refreshFeatures();
    }
  }, [featureService]);

  useEffect(() => {
    setInterval(() => setCurrentTime(new Date()), 1000);
  }, []);

  const handlePhoneNumberValidationRequest = async () => {
    try {
      await beginPhoneNumberValidation(phoneNumber);
    } catch (error) {
      const { data } = error;
      if (data && data.message === 'PHONE_NUMBER_RATE_LIMITED' && data.body) {
        setRateLimitExpiry(new Date(data.body));
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    handlePhoneNumberValidationRequest();
  }, [phoneNumber]);

  if (!user) {
    return <Redirect to={PATHS.LOGIN} />;
  }

  if (!featureState || featureState.WORKPASS_VALIDATION === undefined) {
    return null;
  }

  // TODO This can't use the unified routing because that doesn't accommodate the phone number verification code route.
  let isUserVerified;

  if (featureState.WORKPASS_VALIDATION) {
    isUserVerified =
      user.verificationState.phoneNumber && user.verificationState.workpass;
  } else {
    isUserVerified = user.verificationState.phoneNumber;
  }

  if (isUserVerified) {
    return <Redirect to={PATHS.CONTACTS} />;
  }
  if (!phoneNumber) {
    return <Redirect to={PATHS.VERIFY_PHONE_NUMBER} />;
  }

  const onSubmit = async (event: any) => {
    event.preventDefault();
    try {
      await login(phoneNumber, code);
      await (userService as any).refreshSelf();
    } catch (error) {
      if (!error.data || !error.data.message) {
        throw error;
      }
      const { message } = error.data;
      if (message === 'NOT_WHITELISTED') {
        setHasAllowlistError(true);
      } else if (message === 'BAD_OTP') {
        setHasBadOtpError(true);
      }
    }
  };
  let content;
  if (hasAllowlistError) {
    content = (
      <div>
        {(STRINGS as any)[locale].VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE}
      </div>
    );
  } else {
    content = (
      <form onSubmit={onSubmit} style={{ height: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <div>
            <Typography
              variant="h5"
              component="h1"
              color={hasBadOtpError ? 'error' : 'inherit'}
              style={{ marginBottom: '12px' }}
            >
              {hasBadOtpError
                ? (STRINGS as any)[locale].VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE
                : (STRINGS as any)[
                    locale
                  ].VERIFY_PHONE_NUMBER_VERIFICATION_TITLE.replace(
                    '{phoneNumber}',
                    phoneNumber
                  )}
            </Typography>
            <TextField
              fullWidth
              label={
                (STRINGS as any)[locale]
                  .VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL
              }
              value={code}
              onChange={(error) => setCode(error.target.value)}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <RoundedButton
              style={{
                width: '30%',
              }}
              variant="contained"
              disabled={Number(rateLimitExpiry) - Number(currentTime) > 0}
              disableElevation
              onClick={handlePhoneNumberValidationRequest}
            >
              {Number(rateLimitExpiry) - Number(currentTime) > 0
                ? formatRateLimitExpiry(
                    Number(rateLimitExpiry) - Number(currentTime)
                  )
                : (STRINGS as any)[locale]
                    .VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL}
            </RoundedButton>
            <PrimaryButton
              style={{
                width: '30%',
              }}
              variant="contained"
              disableElevation
              type="submit"
              value="submit"
            >
              {(STRINGS as any)[locale].VERIFY_PHONE_NUMBER_SUBMIT_LABEL}
            </PrimaryButton>
          </div>
        </div>
      </form>
    );
  }
  return <Container>{content}</Container>;
}
