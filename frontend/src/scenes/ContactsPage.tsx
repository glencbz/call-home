import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CallIcon from '@material-ui/icons/Call';
import PhoneDisabledIcon from '@material-ui/icons/PhoneDisabled';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import FeedbackIcon from '@material-ui/icons/Feedback';
import PhoneInTalkIcon from '@material-ui/icons/PhoneInTalk';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import FavoriteIcon from '@material-ui/icons/Favorite';
import HistoryIcon from '@material-ui/icons/History';
import { DateTime, Duration } from 'luxon';
import DetectBrowserSnackbar from '../components/shared/DetectBrowserSnackbar';
import Container from '../components/shared/Container';
import {
  NeutralButton,
  ErrorButton,
  PrimaryButton,
} from '../components/shared/RoundedButton';
import ContactsDialog from '../components/shared/ContactsDialog';
import ReportIssueDialog from '../components/shared/ReportIssueDialog';
import {
  useUserService,
  useContactService,
  useFeatureService,
} from '../contexts';
import { ApiValidationError } from '../services/apiClient';
import PhoneNumberMasks from '../components/shared/PhoneNumberMask';
import {
  formatDurationInHoursMinutes,
  formatDurationInDaysHoursMinutes,
} from '../util/timeFormatters';
import { getNextRefresh } from '../services/PeriodicCredit';
import PATHS from './paths';
import './ContactsPage.css';

const COUNTRIES = {
  en: {
    // Unicode flag + country
    // TODO emoji does not work on windows
    SG: '🇸🇬Singapore',
    BD: '🇧🇩Bangladesh',
  },
  bn: {
    SG: '🇸🇬সিঙ্গাপুর',
    BD: '🇧🇩বাংলাদেশ',
  },
};

const EN_STRINGS = {
  CONTACTS_TITLE: 'Your loved ones',
  CONTACTS_SUBTITLE: 'Call your loved ones back home',
  CONTACTS_LOVED_ONES_LABEL: 'loved ones',
  CONTACTS_ADD_CONTACT_LABEL: 'Add a loved one',
  CONTACTS_ADD_LABEL: 'Add',
  CONTACTS_COUNTRY_LABEL: (code: 'SG' | 'BD') =>
    `Country: ${COUNTRIES.en[code]}`,
  CONTACTS_NAME_LABEL: 'Name',
  CONTACTS_PHONE_NUMBER_LABEL: 'Phone number',
  CONTACTS_EDIT_CONTACT_HEADER: 'Edit',
  CONTACTS_EDIT_LABEL: 'Edit',
  CONTACTS_SAVE_LABEL: 'Save',
  CONTACTS_LOGOUT_LABEL: 'Logout',
  CONTACTS_REPORT_PROBLEM_LABEL: 'Report problem',
  CONTACTS_CANCEL_LABEL: 'Cancel',
  CONTACTS_DELETE_LABEL: 'Delete',
  CONTACTS_DELETE_CONTACT_LABEL: 'Delete contact',
  // TODO This hardcodes the credit interval
  CONTACTS_REACHED_CALL_LIMIT_MESSAGE:
    'You have reached your call limit for the month',
  CONTACTS_TIME_TO_CREDIT_MESSAGE: function CreditMessage(
    timeAmount: string | null,
    creditAmount: string | null
  ) {
    if (!timeAmount) {
      return '';
    }
    return (
      <>
        <strong>{timeAmount}</strong> to {creditAmount} top-up!
      </>
    );
  },
  CONTACTS_CANNOT_UNDO_MESSAGE: 'This action cannot be undone',
  CONTACTS_UNKNOWN_ERROR_MESSAGE: 'Unknown error',
  errors: {
    DUPLICATE_CONTACT: 'You already have a loved one with this number',
    INVALID_PHONE_NUMBER: 'You have entered an invalid phone number',
  },
  CONTACTS_RECENT_CALLS: 'Recent calls',
};

const STRINGS: Record<string, typeof EN_STRINGS> = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    CONTACTS_TITLE: 'আপনার প্রিয়জন',
    CONTACTS_SUBTITLE: 'আপনার প্রিয়জনকে বিনামূল্যে বাড়ি ফিরে কল করুন',
    CONTACTS_ADD_CONTACT_LABEL: 'প্রিয়জনকে যুক্ত করুন',
    CONTACTS_ADD_LABEL: 'যোগ',
    CONTACTS_COUNTRY_LABEL: (code: 'SG' | 'BD') => `দেশ: ${COUNTRIES.bn[code]}`, // Google translate
    CONTACTS_NAME_LABEL: 'নাম', // Google translate
    // TODO this says mobile number
    CONTACTS_PHONE_NUMBER_LABEL: 'মোবাইল নম্বর',
    CONTACTS_EDIT_CONTACT_HEADER: 'সম্পাদন করা',
    CONTACTS_EDIT_LABEL: 'সম্পাদন করা',
    CONTACTS_SAVE_LABEL: 'সংরক্ষণ',
    CONTACTS_LOGOUT_LABEL: 'প্রস্থান',
    CONTACTS_CANCEL_LABEL: 'বাতিল',
    CONTACTS_DELETE_LABEL: 'মুছে ফেলা',
    CONTACTS_DELETE_CONTACT_LABEL: 'যোগাযোগ মুছুন',
    CONTACTS_CANNOT_UNDO_MESSAGE: 'এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না',
    CONTACTS_UNKNOWN_ERROR_MESSAGE: 'অজানা ত্রুটি', // Google translate
    /* errors: {
     *   DUPLICATE_CONTACT: 'You already have a loved one with this number',
     *   INVALID_PHONE_NUMBER: 'You have entered an invalid phone number',
     * }, */
  },
  // TODO: Add translation
  // CONTACTS_RECENT_CALLS: 'Recent calls',
};

type Locale = keyof typeof STRINGS;

const AddContactButton = withStyles((theme) => ({
  root: {
    backgroundColor: 'white',
    border: `1px solid ${theme.palette.grey[200]}`,
    color: (theme as any).palette.primary[700],
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: 'white',
    },
  },
}))(Button);

const AddContactIcon = withStyles((theme) => ({
  root: {
    color: 'white',
    backgroundColor: (theme as any).palette.primary[300],
    borderRadius: '1000px',
  },
}))(AddIcon);

const ContactBox: any = withStyles((theme) => ({
  root: {
    backgroundColor: 'white',
    border: `1px solid ${theme.palette.grey[200]}`,
  },
}))(Box);

const ContactCallIcon = withStyles((theme) => ({
  root: {
    transform: 'rotate(270deg)',
    color: (theme as any).palette.primary[900],
  },
}))(CallIcon);

const ActionLink = withStyles((theme) => ({
  root: {
    cursor: 'pointer',
    display: 'flex',
    color: (theme as any).palette.primary[900],
  },
}))(Typography);

const withDialogButtonStyles = withStyles(() => ({
  root: {
    padding: '1em 2em',
    flex: '1 0',
    margin: '0 0.5rem',
  },
}));

const InfoItem = withStyles((theme) => ({
  root: {
    color: (theme as any).palette.primary[900],
  },
}))(Typography);
const ErrorInfoItem = withStyles((theme) => ({
  root: {
    color: theme.palette.error.main,
  },
}))(Typography);

const DialogNeutralButton = withDialogButtonStyles(NeutralButton);
const DialogPrimaryButton = withDialogButtonStyles(PrimaryButton);
const DialogErrorButton = withDialogButtonStyles(ErrorButton);

function AddContactDialog({ open, onClose, locale }: any) {
  const [userState] = useUserService();
  const { me: user } = userState;
  const [, contactService] = useContactService();
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhoneNumber, setNewContactPhoneNumber] = useState('');
  const [newContactAvatarChoice, setNewContactAvatarChoice] = useState(
    'female_1'
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRequestInFlight, setIsRequestInFlight] = useState(false);

  useEffect(() => {
    setNewContactName('');
    setNewContactPhoneNumber('');
  }, [open]);

  const createContact = async (event: Event) => {
    event.preventDefault();
    try {
      setErrorMessage(null);
      setIsRequestInFlight(true);
      await (contactService as any).createContact(user.id, {
        name: newContactName,
        phoneNumber: newContactPhoneNumber,
        avatar: newContactAvatarChoice,
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const { code } = error;
        setErrorMessage(
          (STRINGS as any)[locale].errors[code] ||
            STRINGS[locale].CONTACTS_UNKNOWN_ERROR_MESSAGE
        );
      }
    } finally {
      setIsRequestInFlight(false);
    }
  };

  const formFields = (
    <>
      <TextField
        style={{
          marginBottom: '12px',
        }}
        fullWidth
        variant="outlined"
        label={STRINGS[locale].CONTACTS_NAME_LABEL}
        value={newContactName}
        onChange={(event) => setNewContactName(event.target.value)}
        className="contacts-dialog-input"
      />
      <TextField
        style={{
          marginBottom: '12px',
        }}
        fullWidth
        variant="outlined"
        label="Phone number"
        value={newContactPhoneNumber}
        onChange={(event) => setNewContactPhoneNumber(event.target.value)}
        InputProps={{
          inputComponent: (PhoneNumberMasks as any)[user.destinationCountry],
        }}
        className="contacts-dialog-input"
      />
    </>
  );
  const actionButtons = (
    <DialogPrimaryButton type="submit" value="submit">
      {STRINGS[locale].CONTACTS_ADD_LABEL}
    </DialogPrimaryButton>
  );
  return (
    <ContactsDialog
      open={open}
      onClose={onClose}
      onSubmit={createContact}
      titleText={STRINGS[locale].CONTACTS_ADD_CONTACT_LABEL}
      formFields={formFields}
      isInProgress={isRequestInFlight}
      actionButtons={actionButtons}
      errorText={errorMessage}
      avatarChoice={newContactAvatarChoice}
      setAvatarChoice={setNewContactAvatarChoice}
    />
  );
}

function EditContactDialog({ contact, open, onClose, locale }: any) {
  const [userState] = useUserService();
  const { me: user } = userState;
  const [, contactService] = useContactService();
  const [newContactName, setNewContactName] = useState(contact.name);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [newContactPhoneNumber, setNewContactPhoneNumber] = useState(
    contact.phoneNumber
  );
  const [newContactAvatarChoice, setNewContactAvatarChoice] = useState(
    contact.avatar || 'female_1'
  );
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRequestInFlight, setIsRequestInFlight] = useState(false);

  const updateContact = async (event: any) => {
    event.preventDefault();
    try {
      setErrorMessage(null);
      setIsRequestInFlight(true);
      await (contactService as any).updateContact(user.id, contact.id, {
        name: newContactName,
        phoneNumber: newContactPhoneNumber,
        avatar: newContactAvatarChoice,
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const { code } = error;
        setErrorMessage(
          (STRINGS as any)[locale].errors[code] ||
            STRINGS[locale].CONTACTS_UNKNOWN_ERROR_MESSAGE
        );
      }
    } finally {
      setIsRequestInFlight(false);
    }
  };

  const deleteContact = async () => {
    await (contactService as any).deleteContact(user.id, contact.id);
    onClose();
  };

  const formFields = (
    <>
      <TextField
        style={{
          marginBottom: '12px',
        }}
        fullWidth
        variant="outlined"
        label={STRINGS[locale].CONTACTS_NAME_LABEL}
        value={newContactName}
        onChange={(event) => setNewContactName(event.target.value)}
        className="contacts-dialog-input"
      />
      <TextField
        style={{
          marginBottom: '12px',
        }}
        fullWidth
        variant="outlined"
        label={STRINGS[locale].CONTACTS_PHONE_NUMBER_LABEL}
        value={newContactPhoneNumber}
        onChange={(event) => setNewContactPhoneNumber(event.target.value)}
        InputProps={{
          inputComponent: (PhoneNumberMasks as any)[user.destinationCountry],
        }}
        className="contacts-dialog-input"
      />
      {isDeletingContact ? (
        <Typography>{STRINGS[locale].CONTACTS_CANNOT_UNDO_MESSAGE}</Typography>
      ) : (
        <Typography
          variant="body2"
          color="error"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => {
            setIsDeletingContact(true);
          }}
        >
          {STRINGS[locale].CONTACTS_DELETE_CONTACT_LABEL}
        </Typography>
      )}
    </>
  );
  const actionButtons = isDeletingContact ? (
    <>
      <DialogNeutralButton
        type="button"
        onClick={() => setIsDeletingContact(false)}
      >
        {STRINGS[locale].CONTACTS_CANCEL_LABEL}
      </DialogNeutralButton>
      <DialogErrorButton type="button" onClick={deleteContact}>
        {STRINGS[locale].CONTACTS_DELETE_LABEL}
      </DialogErrorButton>
    </>
  ) : (
    <DialogPrimaryButton type="submit" value="submit">
      {STRINGS[locale].CONTACTS_SAVE_LABEL}
    </DialogPrimaryButton>
  );

  return (
    <ContactsDialog
      open={open}
      onClose={onClose}
      onSubmit={updateContact}
      titleText={STRINGS[locale].CONTACTS_EDIT_CONTACT_HEADER}
      formFields={formFields}
      actionButtons={actionButtons}
      errorText={errorMessage}
      isInProgress={isRequestInFlight}
      avatarChoice={newContactAvatarChoice}
      setAvatarChoice={setNewContactAvatarChoice}
    />
  );
}

function CallLimitInfo({
  userCallTimeDuration,
  contacts,
  locale,
  nextRefreshTimeString,
  nextRefreshAmount,
  callLimitExceeded,
}: any) {
  const CallTimeInfoItem = callLimitExceeded ? ErrorInfoItem : InfoItem;
  // TODO localization problems here
  const nextRefreshInfoElement =
    nextRefreshTimeString && nextRefreshAmount ? (
      <p>
        <strong>{nextRefreshAmount}</strong> in {nextRefreshTimeString}
      </p>
    ) : (
      ''
    );
  return (
    <div className="info-container" style={{ marginTop: '12px' }}>
      <CallTimeInfoItem variant="subtitle2" className="info-item">
        <PhoneInTalkIcon className="info-icon" />
        {formatDurationInHoursMinutes(userCallTimeDuration)}
      </CallTimeInfoItem>

      <InfoItem variant="subtitle2" className="info-item">
        <AutorenewIcon className="info-icon" />
        {nextRefreshInfoElement}
      </InfoItem>
      <InfoItem variant="subtitle2" className="info-item">
        <FavoriteIcon className="info-icon" />
        {contacts.length} {STRINGS[locale].CONTACTS_LOVED_ONES_LABEL}
      </InfoItem>
    </div>
  );
}

function CallContactButton({ contactService, contact, disabled }: any) {
  const onClick = disabled
    ? undefined
    : () => {
        contactService.setActiveContact(contact);
      };
  const Icon = disabled ? PhoneDisabledIcon : ContactCallIcon;

  return (
    <IconButton style={{ padding: '0' }} onClick={onClick} disabled={disabled}>
      <Icon />
    </IconButton>
  );
}

export default function ContactsPage({ locale }: { locale: Locale }) {
  const [featureState] = useFeatureService();
  const [userState, userService] = useUserService();
  const { me: user } = userState;
  const [contactState, contactService] = useContactService();
  const { contacts = [], activeContact } = contactState;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [nextRefreshTimeString, setNextRefreshTimeString] = useState<
    string | null
  >(null);
  const [nextRefreshAmount, setNextRefreshAmount] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (userService) {
      userService.refreshSelf();
    }
  }, [userService]);
  // TODO change this up so that we don't have to keep supplying user id
  useEffect(() => {
    if (contactService && user) {
      contactService.refreshContacts(user.id);
    }
  }, [contactService, user]);

  useEffect(() => {
    getNextRefresh().then(({ time, amount }) => {
      const nextRefreshDuration = DateTime.fromISO(time).diffNow();
      setNextRefreshTimeString(
        formatDurationInDaysHoursMinutes(nextRefreshDuration)
      );
      setNextRefreshAmount(amount);
    });
  }, []);

  if (!user) {
    return <Redirect to={PATHS.LOGIN} />;
  }
  if (activeContact) {
    return <Redirect to={PATHS.CALLING} />;
  }
  if (!featureState) {
    return null;
  }

  const logout = async () => {
    (window as any).location = '/oauth/logout';
  };

  const onClickRecentCalls = async () => {
    (window as any).location = '/recent';
  };

  const openFeedbackDialog = () => setIsFeedbackDialogOpen(true);
  const userCallTimeDuration = Duration.fromObject({ seconds: user.callTime });
  const callLimitExceeded =
    featureState?.CALL_LIMITS && userCallTimeDuration.as('minutes') < 1;

  const subtitleContent = callLimitExceeded ? (
    <>
      <Typography variant="body1" color="error">
        {STRINGS[locale].CONTACTS_REACHED_CALL_LIMIT_MESSAGE}
      </Typography>
      <Typography
        variant="body1"
        style={{
          marginBottom: '12px',
        }}
      >
        {STRINGS[locale].CONTACTS_TIME_TO_CREDIT_MESSAGE(
          nextRefreshTimeString,
          nextRefreshAmount
        )}
      </Typography>
    </>
  ) : (
    <Typography
      variant="body1"
      style={{
        marginBottom: '12px',
      }}
    >
      {STRINGS[locale].CONTACTS_SUBTITLE}
    </Typography>
  );

  return (
    <Container
      style={{
        background: 'no-repeat url(/images/contacts_bg.svg) bottom center',
        backgroundSize: 'contain',
      }}
    >
      <DetectBrowserSnackbar />
      <Typography
        variant="h5"
        component="h1"
        style={{
          marginBottom: '12px',
          fontWeight: 700,
        }}
      >
        {STRINGS[locale].CONTACTS_TITLE}
      </Typography>
      {subtitleContent}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="body1"
          style={{
            marginBottom: '1rem',
          }}
        >
          {STRINGS[locale].CONTACTS_COUNTRY_LABEL(user.destinationCountry)}
        </Typography>
        <Typography
          variant="body1"
          style={{
            marginBottom: '1rem',
          }}
        >
          <ActionLink
            variant="body1"
            role="button"
            onClick={onClickRecentCalls}
          >
            <HistoryIcon />
            {STRINGS[locale].CONTACTS_RECENT_CALLS}
          </ActionLink>
        </Typography>
      </div>
      <div
        style={{
          // Make this the right height so that the action links are positioned correctly
          height: 'calc(var(--viewport-height) - 15rem)',
        }}
      >
        <div
          style={{
            overflowY: 'scroll',
            width: '100%',
            // 20em to accomodate logout and add contact button
            maxHeight: 'calc(var(--viewport-height) - 20rem)',
          }}
        >
          <List
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {contacts.map((contact: any) => (
              <ListItem
                key={contact.id}
                style={{
                  marginBottom: '0.5rem',
                  padding: '0',
                }}
              >
                <ContactBox
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '4em',
                    padding: '4px 8px',
                  }}
                  variant="outlined"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: '1 0',
                      marginRight: '1rem',
                    }}
                  >
                    <img
                      style={{
                        height: '2.5rem',
                        width: '2.5rem',
                        marginRight: '8px',
                      }}
                      alt=""
                      src={`/images/avatars/${
                        contact.avatar || 'placeholder'
                      }.svg`}
                    />
                    <div
                      style={{
                        flex: '1 0',
                      }}
                    >
                      <Typography variant="body1">{contact.name}</Typography>
                      <div style={{ display: 'flex' }}>
                        <Typography
                          style={{
                            fontSize: '0.675rem',
                            marginRight: '0.5rem',
                          }}
                          variant="body2"
                        >
                          {contact.phoneNumber}
                        </Typography>
                        <Typography
                          style={{ cursor: 'pointer', fontSize: '0.675rem' }}
                          color="primary"
                          role="button"
                          onClick={() => setContactToEdit(contact)}
                        >
                          {STRINGS[locale].CONTACTS_EDIT_LABEL}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  <CallContactButton
                    contactService={contactService}
                    contact={contact}
                    disabled={callLimitExceeded}
                  />
                </ContactBox>
              </ListItem>
            ))}
          </List>
        </div>
        <AddContactButton
          style={{
            width: '100%',
            height: '4em',
            marginTop: '1em',
          }}
          variant="outlined"
          onClick={() => {
            setIsAddDialogOpen(true);
          }}
        >
          <AddContactIcon
            style={{
              marginRight: '1em',
              height: '1.5rem',
              width: '1.5rem',
            }}
          />
          <div>{STRINGS[locale].CONTACTS_ADD_CONTACT_LABEL}</div>
        </AddContactButton>
        {featureState.CALL_LIMITS ? (
          <CallLimitInfo
            userCallTimeDuration={userCallTimeDuration}
            contacts={contacts}
            locale={locale}
            nextRefreshTimeString={nextRefreshTimeString}
            nextRefreshAmount={nextRefreshAmount}
            callLimitExceeded={callLimitExceeded}
          />
        ) : null}
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <ActionLink variant="body1" role="button" onClick={openFeedbackDialog}>
          <FeedbackIcon />
          {STRINGS[locale].CONTACTS_REPORT_PROBLEM_LABEL}
        </ActionLink>
        <ActionLink variant="body1" role="button" onClick={logout}>
          <ExitToAppIcon style={{ transform: 'rotate(180deg)' }} />
          {STRINGS[locale].CONTACTS_LOGOUT_LABEL}
        </ActionLink>
        <AddContactDialog
          onClose={() => setIsAddDialogOpen(false)}
          open={isAddDialogOpen}
          locale={locale}
        />
        <ReportIssueDialog
          user={user}
          onClose={() => setIsFeedbackDialogOpen(false)}
          open={isFeedbackDialogOpen}
          locale={locale}
        />
        {contactToEdit ? (
          <EditContactDialog
            contact={contactToEdit}
            onClose={() => setContactToEdit(null)}
            open
            locale={locale}
          />
        ) : null}
      </div>
    </Container>
  );
}
