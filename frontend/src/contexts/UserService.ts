import createServiceProvider from './createServiceProvider';
import { User } from '../services';

const {
  Provider: UserServiceProvider,
  hook: useUserService,
} = createServiceProvider(User);

export { UserServiceProvider, useUserService };
