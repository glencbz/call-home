import type {
  PhoneNumberValidation as PhoneNumberValidationEntity,
  WorkpassValidation as WorkpassValidationEntity,
} from '../models';
import type { PhoneNumberValidation, WorkpassValidation, Feature } from '.';

export interface VerificationCollection {
  phoneNumber: PhoneNumberValidationEntity | null;
  workpass: WorkpassValidationEntity | null;
}

export interface VerificationState {
  phoneNumber: boolean;
  workpass: boolean;
}

export interface UserVerifications {
  verifications: VerificationCollection;
  state: VerificationState;
}

function UserValidationService(
  featureService: typeof Feature,
  phoneNumberValidationService: typeof PhoneNumberValidation,
  workpassValidationService: typeof WorkpassValidation
): {
  getVerificationsForUser: (userId: number) => Promise<UserVerifications>;
  isUserVerified: (
    userId: number,
    verificationState?: VerificationState
  ) => Promise<boolean>;
} {
  async function getVerificationsForUser(
    userId: number
  ): Promise<UserVerifications> {
    const [phoneNumberValidation, workpassValidation] = await Promise.all([
      phoneNumberValidationService.getPhoneNumberValidationForUser(userId),
      workpassValidationService.getWorkpassValidationForUser(userId),
    ]);

    return {
      verifications: {
        phoneNumber: phoneNumberValidation,
        workpass: workpassValidation,
      },
      state: {
        phoneNumber: phoneNumberValidation?.isPhoneNumberValidated || false,
        workpass: workpassValidation?.isWorkpassValidated || false,
      },
    };
  }

  async function isUserVerified(
    userId: number,
    maybeVerificationState?: VerificationState
  ): Promise<boolean> {
    let verificationState = maybeVerificationState;
    if (!verificationState) {
      verificationState = (await getVerificationsForUser(userId)).state;
    }
    if (featureService.shouldEnableWorkpassValidation(userId)) {
      return verificationState.phoneNumber && verificationState.workpass;
    }
    return verificationState.phoneNumber;
  }

  return {
    getVerificationsForUser,
    isUserVerified,
  };
}

export default UserValidationService;
