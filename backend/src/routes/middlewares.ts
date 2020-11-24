import type { Request, Response, NextFunction } from 'express';

// TODO don't hardcode this
import {
  UserValidation as UserValidationService,
  User as UserService,
  Feature,
} from '../services';
import { UserTypes } from '../models';
import {
  userToUserResponse,
  userProfileToUserProfileResponse,
  UserResponse,
} from './transformers';

const LOGIN_ROUTE = '/';

interface AuthenticatedRequest extends Request {
  user: any;
  session: any;
}

export interface UserInjectedRequest extends AuthenticatedRequest {
  user: UserResponse;
}

function sendForbiddenResponse(req: UserInjectedRequest, res: Response) {
  res.format({
    json: () => {
      req.log.info('Encountered api call, sending 401');
      return res.status(401).json({ location: LOGIN_ROUTE });
    },
    html: () => {
      req.log.info('Encountered browser request, redirecting to ', LOGIN_ROUTE);
      req.session.returnTo = req.originalUrl;
      return res.redirect(LOGIN_ROUTE);
    },
    default: () => {
      req.session.returnTo = req.originalUrl;
      return res.redirect(LOGIN_ROUTE);
    },
  });
}

async function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  // Detect the protocol of the user's request. Reading req.protocol does not work.
  // https://devcenter.heroku.com/articles/http-routing#heroku-headers
  if (req.headers['x-forwarded-proto'] !== 'https') {
    req.log.info('Detected http, redirecting');
    return res.redirect(`https://${req.host}${req.originalUrl}`);
  }
  return next();
}

async function injectDbUser(req: AuthenticatedRequest) {
  // This returns the OAuth user info
  const { _raw, _json, ...userProfile } = req.user;
  const { emails } = userProfile;
  req.log.info('Injecting for profile', userProfile);
  const userProfileResponse = userProfileToUserProfileResponse(userProfile);
  const auth0Id = userProfile.userId || userProfile.id;

  let user;
  if (emails) {
    user = await UserService.getUserByEmails(
      emails.map((emailValue: any) => emailValue.value)
    );
    if (user && !user.auth0Id) {
      user = await UserService.updateUser(user.id, {
        ...user,
        auth0Id,
      });
    }
  }

  if (!user) {
    if (auth0Id) {
      user = await UserService.getUserByAuth0Id(auth0Id);
    } else {
      req.user = userProfile;
      return;
    }
  }

  if (!user) {
    // TODO think about this more carefully
    req.log.error(
      '===================================no user found, what do i do???'
    );
    return;
  }
  const {
    verifications,
    state,
  } = await UserValidationService.getVerificationsForUser(user.id);
  const userResponse = userToUserResponse(
    user,
    verifications.phoneNumber,
    state
  );
  req.user = {
    ...userProfileResponse,
    ...userResponse,
  };
}

async function requireAdmin(
  req: UserInjectedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).send('Unauthenticated');
  }
  if (req.user.role !== UserTypes.ADMIN) {
    return res.status(403).send('Need to be admin');
  }
  return next();
}

async function requireVerified(
  req: UserInjectedRequest,
  res: Response,
  next: NextFunction
) {
  if (
    !req.user ||
    !UserValidationService.isUserVerified(
      req.user.id,
      req.user.verificationState
    )
  ) {
    sendForbiddenResponse(req, res);
    return;
  }
  next();
}

async function requireSelf(
  req: UserInjectedRequest,
  res: Response,
  next: NextFunction
) {
  const { userId: userIdString } = req.params;
  const userId = Number(userIdString);
  if (!req.user || !userId || req.user.id !== userId) {
    sendForbiddenResponse(req, res);
    return;
  }
  next();
}

async function secureRoutes(
  req: UserInjectedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user) {
    await injectDbUser(req);
    return next();
  }
  req.log.info('No user found');

  // We return a different result based on the Accept header of the request.
  // We redirect html requests to the login route
  // However, if the request is an xhr, a redirection does not work because the browser hides the intermediate HTTP redirects. Instead, we return a 403 and hint the caller to go to another location
  return sendForbiddenResponse(req, res);
}

export {
  httpsRedirect,
  secureRoutes,
  requireAdmin,
  requireVerified,
  requireSelf,
};
