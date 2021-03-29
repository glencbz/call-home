import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import FeedbackIcon from '@material-ui/icons/Feedback';
import Container from 'components/shared/Container';
import DetectBrowserSnackbar from 'components/shared/DetectBrowserSnackbar';
import { SceneProps } from 'scenes/types';

import './Login.css';

// TODO figure out where to put these later
const EN_STRINGS = {
  DISPLAY_TITLE: 'Call Home',
  DISPLAY_SUBTITLE: 'Make free calls to loved ones back home in Bangladesh',
  DATA_CONSUMPTION_COPY: '100MB = 40 min talk',
  FACEBOOK_SIGN_UP: 'Sign up with Facebook',
  FACEBOOK_MESSAGE: "Can't sign in? Message us!",
  GOOGLE_SIGN_UP: 'Sign up with Google',
};
const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    DISPLAY_TITLE: 'বাড়ীতে ফোন',
    // TODO this also includes India in the list of countries
    DISPLAY_SUBTITLE: 'ভারতে ফিরে বাংলাদেশে প্রিয়জনকে বিনামূল্যে কল করুন',
    /* DATA_CONSUMPTION_COPY: '100MB = 40 min talk', */
    FACEBOOK_SIGN_UP: 'ফেসবুক দিয়ে সাইন আপ',
    FACEBOOK_MESSAGE: 'সাইন ইন করতে পারবেন না? আমাদের বার্তা!',
  },
};

const DataConsumptionCopy = withStyles((theme: any) => ({
  root: {
    borderRadius: '10000px',
    background: 'white',
    border: `1px solid ${theme.palette.primary[800]}`,
    color: theme.palette.primary[800],
    padding: '0 12px',
  },
}))(Box);

const FacebookButton = withStyles(() => ({
  root: {
    marginTop: '60px',
    backgroundColor: '#1877F2',
    width: '100%',
    color: 'white',
    padding: '19px',
  },
}))(Button);

const GoogleButton = withStyles(() => ({
  root: {
    marginTop: '60px',
    backgroundColor: '#FFFFFF',
    width: '100%',
    color: 'grey',
    fontWeight: 'bold',
  },
}))(Button);

const SupportButton = withStyles((theme: any) => ({
  root: {
    color: 'grey',
    fontWeight: 'bold',
    padding: '8px',
    marginTop: '16px',
  },
}))(Button);

export default function Login({ locale }: SceneProps) {
  return (
    <Container
      style={{
        background: 'no-repeat url(/images/landing_bg.svg) bottom center',
        backgroundSize: 'contain',
        overflow: 'auto',
      }}
    >
      <DetectBrowserSnackbar />
      <div className="login-content">
        <img alt="" src="/images/landing_splash.svg" />
        <Typography style={{ marginTop: '24px' }} variant="h5" component="h1">
          {STRINGS[locale].DISPLAY_TITLE}
        </Typography>
        <Typography
          style={{ marginTop: '12px', textAlign: 'center' }}
          variant="body1"
        >
          {STRINGS[locale].DISPLAY_SUBTITLE}
        </Typography>
        <DataConsumptionCopy>
          <Typography variant="body2">
            {STRINGS[locale].DATA_CONSUMPTION_COPY}
          </Typography>
        </DataConsumptionCopy>
        <GoogleButton
          className="sign-up-button"
          variant="contained"
          disableElevation
          onClick={() => {
            (window as any).location = '/oauth/login/google';
          }}
          style={{ marginTop: '36px' }}
        >
          <img
            style={{ height: '3rem' }}
            alt=""
            src="/images/google_login.svg"
          />
          {STRINGS[locale].GOOGLE_SIGN_UP}
        </GoogleButton>
        <FacebookButton
          className="sign-up-button"
          variant="contained"
          disableElevation
          onClick={() => {
            (window as any).location = '/oauth/login/facebook';
          }}
          style={{ marginTop: '36px' }}
        >
          {STRINGS[locale].FACEBOOK_SIGN_UP}
        </FacebookButton>
        <SupportButton className="sign-up-button" disableElevation>
          <a
            href="https://m.me/callhomesg"
            style={{ color: 'grey', display: 'flex' }}
          >
            <FeedbackIcon />
            {STRINGS[locale].FACEBOOK_MESSAGE}
          </a>
        </SupportButton>
      </div>
    </Container>
  );
}
