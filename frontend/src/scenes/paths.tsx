import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useUserService, useFeatureService } from '../contexts';
import { UserEntity, FeatureState } from '../services';

const PATHS = Object.freeze({
  LOGIN: '/',
  ADMIN: '/admin',
  CALLING: '/call',
  CONTACTS: '/contacts',
  TRANSACTIONS: '/transactions',
  VERIFY_PHONE_NUMBER: '/verify-phone',
  VERIFY_PHONE_NUMBER_CODE: '/verify-phone/code',
  VERIFY_WORKPASS: '/verify-workpass',
  RECENT: '/recent',
});

// TODO Feature state is sometimes {} due to compatibility reasons
function routeFromState(
  user: UserEntity | null,
  featureState: FeatureState | null | Record<string, undefined>
): string | null {
  if (!user || !featureState) {
    return PATHS.LOGIN;
  }

  if (featureState.WORKPASS_VALIDATION === undefined) {
    return null;
  }

  let isUserVerified;
  if (featureState.WORKPASS_VALIDATION) {
    isUserVerified =
      user.verificationState.phoneNumber && user.verificationState.workpass;
  } else {
    isUserVerified = user.verificationState.phoneNumber;
  }

  if (isUserVerified) {
    return PATHS.CONTACTS;
  }

  // Verify phone number before work pass. This works for users with and without work pass verification enabled
  if (!user.verificationState.phoneNumber) {
    return PATHS.VERIFY_PHONE_NUMBER;
  }

  if (!user.verificationState.workpass) {
    return PATHS.VERIFY_WORKPASS;
  }

  return null;
}

interface RoutingResult {
  shouldRender: boolean;
  renderElement: JSX.Element | null;
}

function useRouting(ownRoute: string): RoutingResult {
  const [userState, userService] = useUserService();
  const { me: user = null } = userState || {};
  const [userRequestInFlight, setUserRequestInFlight] = useState(true);

  const [featureState, featureService] = useFeatureService();
  const [featureRequestInFlight, setFeatureRequestInFlight] = useState(true);

  useEffect(() => {
    if (userService) {
      (userService as any)
        .refreshSelf()
        .finally(() => setUserRequestInFlight(false));
    }
  }, [userService]);

  useEffect(() => {
    if (featureService) {
      featureService
        .refreshFeatures()
        .finally(() => setFeatureRequestInFlight(false));
    }
  }, [featureService]);

  if (userRequestInFlight) {
    return {
      shouldRender: true,
      renderElement: null,
    };
  }

  if (featureRequestInFlight === true) {
    return {
      shouldRender: true,
      renderElement: null,
    };
  }

  const route = routeFromState(user, featureState);
  if (route === ownRoute) {
    return {
      shouldRender: false,
      renderElement: null,
    };
  }
  if (route) {
    return {
      shouldRender: true,
      renderElement: <Redirect to={route} />,
    };
  }

  return {
    shouldRender: false,
    renderElement: null,
  };
}

export { useRouting };
export default PATHS;
