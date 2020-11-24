import express from 'express';
import { UserInjectedRequest, requireAdmin } from './middlewares';
import { userToUserResponse, UserResponse } from './transformers';
import type { User as UserModel } from '../models';
import type {
  User,
  Wallet,
  PeriodicCredit,
  PhoneNumberValidation,
  UserValidation,
  WorkpassValidation,
} from '../services';

function UserRoutes(
  userService: typeof User,
  periodicCreditService: typeof PeriodicCredit,
  userValidationService: typeof UserValidation,
  walletService: typeof Wallet
) {
  const router = express.Router();

  async function injectPhoneNumberValidation(user: UserModel) {
    const userValidation = await userValidationService.getVerificationsForUser(
      user.id
    );
    return userToUserResponse(
      user,
      userValidation.verifications.phoneNumber,
      userValidation.state
    );
  }

  async function injectWallet(user: UserResponse) {
    const wallet = await walletService.getWalletForUser(user.id);
    return {
      ...user,
      callTime: wallet?.callTime,
    };
  }

  router.get('/me', async (req: UserInjectedRequest, res) => {
    const { user } = req;
    const isUserVerified = await userValidationService.isUserVerified(
      req.user.id,
      req.user.verificationState
    );

    let userTasks: Promise<unknown>[] = [
      walletService.createWalletForUser(user.id),
    ];
    if (isUserVerified) {
      userTasks = [
        ...userTasks,
        periodicCreditService.tryCreatePeriodicCredit(user.id),
      ];
    }
    await Promise.all(userTasks);
    const userWithWallet = await injectWallet(req.user);
    // Return isVerified for old clients
    return res
      .status(200)
      .json({ ...userWithWallet, isVerified: isUserVerified });
  });

  router.get('/', requireAdmin, async (_req: UserInjectedRequest, res) => {
    const users = await userService.listUsers();
    const usersWithPhoneNumber = await Promise.all(
      users.map(injectPhoneNumberValidation)
    );
    const usersWithWallet = await Promise.all(
      usersWithPhoneNumber.map(injectWallet)
    );
    return res.json(usersWithWallet);
  });

  return router;
}

export default UserRoutes;
