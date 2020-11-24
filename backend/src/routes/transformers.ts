import type { Request, Response, NextFunction } from 'express';
import type {
  Contact,
  PhoneNumberValidation,
  WorkpassValidation,
  User,
  UserTypes,
} from '../models';
import { logger } from '../config';
import { VerificationState } from '../services';

export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
  destinationCountry: string;
  role: UserTypes;

  verificationState: VerificationState;
  phoneNumber: string | null;
}

export interface UserProfileResponse {
  displayName: string;
  name: string;
  emails: string[];
  picture: string;
  userId: string;
}

function parseUserRequestBody(req: Request, res: Response, next: NextFunction) {
  const { name, email } = req.body;

  const errorMessages = [];
  if (!name) {
    errorMessages.push("User's name is missing");
  }
  if (!email) {
    errorMessages.push("User's email is missing");
  }
  if (errorMessages.length > 0) {
    return res.status(400).send(`Invalid User: ${errorMessages.join('\n')}`);
  }

  req.body = {
    name,
    email,
  };

  return next();
}

function contactToContactResponse(contact: Contact) {
  const { id, name, phoneNumber, avatar } = contact;

  const response = {
    id,
    name,
    phoneNumber,
    avatar,
  };
  return response;
}

function userToUserResponse(
  user: User,
  phoneNumberValidation: PhoneNumberValidation | null,
  verificationState: VerificationState
): UserResponse {
  const { id, name, email, destinationCountry, role } = user;

  return {
    id,
    name,
    email,
    destinationCountry,
    role,
    phoneNumber: phoneNumberValidation && phoneNumberValidation.phoneNumber,
    verificationState,
  };
}

function userProfileToUserProfileResponse(
  userProfile: any
): UserProfileResponse {
  const { displayName, name, emails, picture, user_id: userId } = userProfile;

  logger.info('UserProfile', userProfile);
  return {
    displayName,
    name,
    emails,
    picture,
    userId,
  };
}

function parseContactRequestBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name, phoneNumber, avatar } = req.body;

  const errorMessages = [];
  if (!name) {
    errorMessages.push("Contact's name is missing");
  }
  if (!phoneNumber) {
    errorMessages.push("Contact's phone number is missing");
  }

  req.body = {
    name,
    phoneNumber,
    avatar,
  };

  return next();
}

function handleServiceError(error: Error, res: Response) {
  // TODO do this smarter
  if (error.message.startsWith('Validation Error:')) {
    return res.status(400).send(error.message);
  }
  if (error.message.startsWith('Invalid country code')) {
    return res.status(400).send(error.message);
  }
  return res.status(500);
}

export {
  parseUserRequestBody,
  userToUserResponse,
  userProfileToUserProfileResponse,
  parseContactRequestBody,
  contactToContactResponse,
  handleServiceError,
};
