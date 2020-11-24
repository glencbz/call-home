import { sanitizeDbErrors } from './lib';
import type { User as UserEntity } from '../models';
import type { AllowlistEntry, PhoneNumberValidation } from '.';
import { logger } from '../config';

function UserService(
  UserModel: typeof UserEntity,
  allowlistEntryService: typeof AllowlistEntry,
  phoneNumberValidationService: typeof PhoneNumberValidation
) {
  async function listUsers() {
    return UserModel.findAll({
      order: ['email'],
    });
  }

  async function createUser(user: Partial<UserEntity>) {
    const createdUser = await sanitizeDbErrors(() =>
      UserModel.create({
        ...user,
        isPhoneNumberValidated: false,
      })
    );
    await createdUser.save();
    await createdUser.reload();
    await phoneNumberValidationService.createPhoneNumberValidationForUser(
      createdUser.id
    );
    return createdUser;
  }

  async function getUser(userId: number) {
    return UserModel.findOne({
      where: {
        id: userId,
      },
    });
  }

  async function getUserByEmail(userEmail: string) {
    return UserModel.findOne({
      where: {
        email: userEmail,
      },
    });
  }

  async function getUserByAuth0Id(auth0Id: string) {
    return UserModel.findOne({
      where: {
        auth0Id,
      },
    });
  }

  async function updateUser(userId: number, user: Partial<UserEntity>) {
    const userPayload = {
      ...user,
    };

    if (userPayload.email) {
      userPayload.email = userPayload.email.toLowerCase();
    }

    await UserModel.update(userPayload, {
      where: {
        id: userId,
      },
    });
    const updatedUser = await getUser(userId);
    return updatedUser;
  }

  async function deleteUser(userId: number) {
    const user = await getUser(userId);
    if (!user) {
      const msg = `User not found for userId ${userId}`;
      logger.error(msg);
      throw new Error(msg);
    }
    await user.destroy();
  }

  async function getUserByEmails(userEmails: string[]) {
    const allUsers = await Promise.all(
      userEmails.map((userEmail) => getUserByEmail(userEmail))
    );
    const foundUser = allUsers.find((user) => user);
    return foundUser;
  }

  async function registerUserWithAuth0Id(
    auth0Id: string,
    user: { name: string; email: string }
  ) {
    const foundUser = await getUserByAuth0Id(auth0Id);
    if (foundUser) {
      return foundUser;
    }
    return createUser({
      name: user.name,
      email: user.email,
      auth0Id,
    });
  }

  // This function handles a request to assign a phone number to a given user.
  async function verifyUserPhoneNumber(userId: number, phoneNumber: string) {
    // We check the allowlist to ensure that the phone number is allowed in the first place.
    const [user, allowlistEntry] = await Promise.all([
      getUser(userId),
      allowlistEntryService.getAllowlistEntryByPhoneNumber(phoneNumber),
    ]);

    if (!user) {
      const msg = `User not found for userId ${userId}`;
      logger.error(msg);
      throw new Error(msg);
    }

    // If the user is not allowed, we can just stop here
    if (!allowlistEntry) {
      return user;
    }

    // Otherwise, we need to consider the case where the phone number is already registered with another user.
    // Phone numbers must be unique, so before we can do anything, we must invalidate the other user
    await phoneNumberValidationService.validateUser(user.id, phoneNumber);

    user.destinationCountry = allowlistEntry.destinationCountry;
    user.role = allowlistEntry.role;
    await user.save();
    await user.reload();
    return user;
  }

  return {
    listUsers,
    createUser,
    getUser,
    getUserByEmail,
    updateUser,
    deleteUser,
    verifyUserPhoneNumber,
    getUserByEmails,
    getUserByAuth0Id,
    registerUserWithAuth0Id,
  };
}

export { UserService };
export default UserService;
