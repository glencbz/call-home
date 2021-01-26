import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useUserService, useFeatureService } from '../contexts';
import { UserState, FeatureState } from '../services';

const PATHS = Object.freeze({
  LOGIN: '/',
  ADMIN: '/admin',
  CALLING: '/call',
  CONTACTS: '/contacts',
  TRANSACTIONS: '/transactions',
  VERIFY_PHONE_NUMBER: '/verify-phone',
  VERIFY_PHONE_NUMBER_CODE: '/verify-phone/code',
  VERIFY_WORKPASS: '/verify-workpass',
  RECENT_CALLS: '/recent-calls',
});

// TODO Verification should probably all be routed to the same /verify/ path and then branch out from there.
function routeFromState(
  userState: UserState,
  featureState: FeatureState | null
): string | null {
  const { me: user } = userState;

  if (!user || !featureState) {
    return PATHS.LOGIN;
  }

  let isUserVerified;
  if (user.verificationState.adminGranted) {
    isUserVerified = true;
  } else {
    isUserVerified =
      user.verificationState.phoneNumber && user.verificationState.workpass;
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

  if (userRequestInFlight || !userState) {
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

  const route = routeFromState(userState, featureState);
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
