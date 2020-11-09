import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Container from '../components/shared/Container';
import { useUserService } from '../contexts';
import RoundedButton, {
  PrimaryButton,
} from '../components/shared/RoundedButton';
import { beginPasswordless, login } from '../services/Auth';
import PATHS from './paths';

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
      'আপনার মোবাইল নাম্বারে পাঠানো ভেরিফিকেশনকোডটি লিখুন ({phoneNumber})',
    VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE: 'ভুল কোড',
    VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL: 'ভেরিফিকেশন কোড',
    VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL: 'আবার পাঠান',
    VERIFY_PHONE_NUMBER_SUBMIT_LABEL: 'জমা দিন', // Google translate
    VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE:
      ' দুঃখিত, আপনার ফোন নম্বর এই প্রোগ্রামের অংশ নয়। যদি আপনি বিশ্বাস করেন যে এখানে ভুল হয়েছে, তবে প্রশাসকের সাথে যোগাযোগ করুন।'
  },
};

// TODO replace with better parsing like moment.js
function formatRateLimitExpiry(rateLimitExpiryMillis) {
  const totalSeconds = Math.round(rateLimitExpiryMillis / 1000);
  const seconds = totalSeconds % 60;
  const minutes = (totalSeconds - seconds) / 60;
  return `${minutes}:${seconds}`;
}

export default function VerificationPhoneNumberCode({ locale }) {
  const [userState, userService] = useUserService();
  const { me: user } = userState;
  const { verificationPhoneNumber: phoneNumber } = userState;
  const [code, setCode] = useState('');
  const [hasBadOtpError, setHasBadOtpError] = useState(false);
  const [hasAllowlistError, setHasAllowlistError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rateLimitExpiry, setRateLimitExpiry] = useState(new Date());

  useEffect(() => {
    if (userService) {
      userService.refreshSelf();
    }
  }, [userService]);

  useEffect(() => {
    setInterval(() => setCurrentTime(new Date()), 1000);
  }, []);

  const handlePasswordlessRequest = async () => {
    try {
      await beginPasswordless(phoneNumber);
    } catch (error) {
      const { data } = error;
      if (data && data.message === 'PASSWORDLESS_RATE_LIMITED' && data.body) {
        setRateLimitExpiry(new Date(data.body));
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    handlePasswordlessRequest();
  }, [phoneNumber]);

  if (!user) {
    return <Redirect to={PATHS.LOGIN} />;
  }
  if (user.isVerified) {
    return <Redirect to={PATHS.CONTACTS} />;
  }
  if (!phoneNumber) {
    return <Redirect to={PATHS.VERIFY_PHONE_NUMBER} />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(phoneNumber, code);
      await userService.refreshSelf();
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
      <div>{STRINGS[locale].VERIFY_PHONE_NUMBER_WHITELIST_ERROR_MESSAGE}</div>
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
                ? STRINGS[locale].VERIFY_PHONE_NUMBER_WRONG_CODE_TITLE
                : STRINGS[
                    locale
                  ].VERIFY_PHONE_NUMBER_VERIFICATION_TITLE.replace(
                    '{phoneNumber}',
                    phoneNumber
                  )}
            </Typography>
            <TextField
              fullWidth
              label={
                STRINGS[locale].VERIFY_PHONE_NUMBER_VERIFICATION_CODE_LABEL
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
              disabled={rateLimitExpiry - currentTime > 0}
              disableElevation
              onClick={() => {
                handlePasswordlessRequest(phoneNumber);
              }}
            >
              {rateLimitExpiry - currentTime > 0
                ? formatRateLimitExpiry(rateLimitExpiry - currentTime)
                : STRINGS[locale].VERIFY_PHONE_NUMBER_RESEND_CODE_LABEL}
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
              {STRINGS[locale].VERIFY_PHONE_NUMBER_SUBMIT_LABEL}
            </PrimaryButton>
          </div>
        </div>
      </form>
    );
  }
  return <Container>{content}</Container>;
}
