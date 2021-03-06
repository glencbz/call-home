export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface UserWalletResponse {
  id: number;
  name: string;
  email: string | null;
  destinationCountry: string;
  role: UserType;

  verificationState: {
    phoneNumber: boolean;
    workpass: boolean;
    adminGranted: boolean;
  };

  phoneNumber: string | null;
  callTime: number | null;
  createdAt: string | null;
}
