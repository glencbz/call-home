import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Container from '../components/shared/Container';
import DetectBrowserSnackbar from '../components/shared/DetectBrowserSnackbar';
import { useRouting } from './paths';

import './Login.css';

// TODO figure out where to put these later
const EN_STRINGS = {
  DISPLAY_TITLE: 'Call Home',
  DISPLAY_SUBTITLE: 'Make free calls to loved ones back home in Bangladesh',
  DATA_CONSUMPTION_COPY: '100MB = 40 min talk',
  FACEBOOK_SIGN_UP: 'Sign up with Facebook',
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
  },
};

const DataConsumptionCopy = withStyles((theme) => ({
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
    padding: '10px',
  },
}))(Button);

export default function Login({ locale, routePath }) {
  const routeResult = useRouting(routePath);

  if (routeResult.shouldRender) {
    return routeResult.renderElement;
  }

  return (
    <Container
      style={{
        background: 'no-repeat url(/images/landing_bg.svg) bottom center',
        backgroundSize: 'contain',
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
        <FacebookButton
          className="sign-up-button"
          variant="contained"
          disableElevation
          onClick={() => {
            window.location = '/oauth/login';
          }}
          style={{ marginTop: '36px' }}
        >
          {STRINGS[locale].FACEBOOK_SIGN_UP}
        </FacebookButton>
      </div>
    </Container>
  );
}
