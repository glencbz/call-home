import * as models from '../models';

import Call from './Call';
import PeriodicCredit from './PeriodicCredit';
import TwilioCall from './TwilioCall';
import * as TwilioClient from './TwilioClient';
import Transaction from './Transaction';
import Wallet from './Wallet';
import User from './User';
import * as Feature from './Feature';
import AllowlistEntry from './AllowlistEntry';
import PhoneNumberValidation from './PhoneNumberValidation';
import WorkpassValidation from './WorkpassValidation';
import * as WorkpassClient from './WorkpassClient';
import UserValidation, { VerificationState } from './UserValidation';
import Contact = require('./Contact');
import Auth0 = require('./Auth0');

// TOPOLOGICAL SORT LOL
const transactionService = new Transaction(models.Transaction);
const allowlistEntryService = AllowlistEntry(
  models.AllowlistEntry,
  TwilioClient
);
const auth0Service = Auth0();
const phoneNumberValidationService = PhoneNumberValidation(
  models.PhoneNumberValidation
);

const userService = User(
  models.User,
  allowlistEntryService,
  phoneNumberValidationService
);
const contactService = Contact(models.Contact, userService);
const periodicCreditService = PeriodicCredit(
  models.PeriodicCredit,
  phoneNumberValidationService,
  transactionService
);
const walletService = new Wallet(models.Wallet, transactionService);
const workpassValidationService = WorkpassValidation(
  models.WorkpassValidation,
  WorkpassClient
);
const userValidationService = UserValidation(
  Feature,
  phoneNumberValidationService,
  workpassValidationService
);
const callService = Call(
  models.Call,
  userService,
  contactService,
  userValidationService,
  walletService
);
const twilioCallService = new TwilioCall(
  models.TwilioCall,
  TwilioClient,
  callService,
  transactionService
);

export {
  Feature,
  TwilioClient,
  VerificationState,
  WorkpassClient,
  allowlistEntryService as AllowlistEntry,
  auth0Service as Auth0,
  callService as Call,
  contactService as Contact,
  periodicCreditService as PeriodicCredit,
  transactionService as Transaction,
  twilioCallService as TwilioCall,
  userService as User,
  userValidationService as UserValidation,
  phoneNumberValidationService as PhoneNumberValidation,
  walletService as Wallet,
  workpassValidationService as WorkpassValidation,
};
