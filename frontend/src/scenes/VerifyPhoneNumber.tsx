import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import TextFieldWrong from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ContainerWrong from '../components/shared/Container';
import { useUserService } from '../contexts';
import { PrimaryButton } from '../components/shared/RoundedButton';
import PhoneNumberMasks from '../components/shared/PhoneNumberMask';
import PATHS, { useRouting } from './paths';
import { SceneProps } from './types';

const Container: React.FunctionComponent<any> = ContainerWrong;
const TextField: React.FunctionComponent<any> = TextFieldWrong;

// TODO figure out where to put these later
const EN_STRINGS = {
  VERIFY_PHONE_NUMBER_TITLE: "What's your mobile number?",
  VERIFY_PHONE_NUMBER_NEXT: 'Next',
  VERIFY_PHONE_NUMBER_PHONE_NUMBER_LABEL: 'Phone number',
};
const STRINGS = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    VERIFY_PHONE_NUMBER_TITLE: 'আপনার মোবাইল নম্বরটি কী?',
    VERIFY_PHONE_NUMBER_NEXT: 'পরবর্তী',
    VERIFY_PHONE_NUMBER_PHONE_NUMBER_LABEL: 'আপনার মোবাইল নাম্বার',
  },
};

export default function VerifyPhoneNumber({ locale, routePath }: SceneProps) {
  const routeResult = useRouting(routePath);
  const [userState, userService] = useUserService();
  const { verificationPhoneNumber } = userState || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  if (routeResult.shouldRender) {
    return routeResult.renderElement;
  }

  if (verificationPhoneNumber) {
    return <Redirect to={PATHS.VERIFY_PHONE_NUMBER_CODE} />;
  }

  const validatePhoneNumber = () => {
    if (!phoneNumber) {
      return false;
    }
    return phoneNumber.match(/\d{8}/);
  };
  const onSubmit = (event: any) => {
    event.preventDefault();
    setIsTouched(true);
    if (validatePhoneNumber()) {
      (userService as any).setPhoneNumber(phoneNumber);
    }
  };

  return (
    <Container>
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
              style={{ marginBottom: '12px' }}
            >
              {(STRINGS as any)[locale].VERIFY_PHONE_NUMBER_TITLE}
            </Typography>
            <TextField
              fullWidth
              autoFocus
              error={isTouched && !validatePhoneNumber()}
              label={
                (STRINGS as any)[locale].VERIFY_PHONE_NUMBER_PHONE_NUMBER_LABEL
              }
              value={phoneNumber}
              variant="outlined"
              InputProps={{
                inputComponent: PhoneNumberMasks.SG,
              }}
              onChange={(event: any) => {
                setIsTouched(true);
                setPhoneNumber(event.target.value);
              }}
            />{' '}
          </div>{' '}
          <PrimaryButton
            disableFocusRipple
            color="primary"
            type="submit"
            value="submit"
          >
            {' '}
            {(STRINGS as any)[locale].VERIFY_PHONE_NUMBER_NEXT}{' '}
          </PrimaryButton>
        </div>
      </form>
    </Container>
  );
}
