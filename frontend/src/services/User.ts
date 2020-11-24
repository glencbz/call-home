import { noRedirectClient, UnauthenticatedError } from './apiClient';
import ObservableService from './observableService';

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// TODO this is the same as the UserResponse type in the backend. Find a way to combine them
export interface User {
  id: number;
  name: string;
  email: string | null;
  destinationCountry: string;
  role: UserType;

  verificationState: {
    phoneNumber: boolean;
    workpass: boolean;
  };

  phoneNumber: string | null;
}

export interface UserState {
  me: User | null;
  verificationPhoneNumber: string | null;
}

// TODO make this configurable
const userEndpoint = '/users';

export default class UserService extends ObservableService<UserState> {
  constructor() {
    super();
    this.state = {
      me: null,
      verificationPhoneNumber: null,
    };
  }

  async logout(): Promise<void> {
    this.state.me = null;
    this.notify();
  }

  async refreshSelf(): Promise<void> {
    try {
      const me = (await noRedirectClient.get(`${userEndpoint}/me`)) as User;
      this.state = {
        ...this.state,
        me,
      };
      this.notify();
    } catch (e) {
      if (e instanceof UnauthenticatedError) {
        return;
      }
      throw e;
    }
  }

  async setPhoneNumber(verificationPhoneNumber: string): Promise<void> {
    this.state = {
      ...this.state,
      verificationPhoneNumber,
    };
    this.notify();
  }
}
