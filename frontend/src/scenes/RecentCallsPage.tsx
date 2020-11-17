import React from 'react';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import { format, formatDistance } from 'date-fns';
import CardContent from '@material-ui/core/CardContent';
import Container from '../components/shared/Container';

const CONTACTS = [
  {
    callId: 1,
    name: 'MY NAME',
    phoneNumber: '+6588888888',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
  },
  {
    callId: 2,
    name: 'MY NAME 2',
    phoneNumber: '+6588888888',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
  },
];

const EN_STRINGS = {
  RECENT_TITLE: 'Recent Calls',
};

const STRINGS: Record<string, typeof EN_STRINGS> = {
  en: EN_STRINGS,
  bn: {
    ...EN_STRINGS,
    // TODO: update translation
    RECENT_TITLE: 'Recent bo',
  },
};

function ContactCard({ contact }: { contact: any }) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <CardContent>
        <Typography>{contact.name}</Typography>
        <Typography>{contact.phoneNumber}</Typography>
        <Typography>
          {format(new Date(contact.startTime), 'yyyy')} mins
        </Typography>
        <Typography>
          {formatDistance(
            new Date(contact.startTime),
            new Date(contact.endTime)
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ContactCards() {
  return (
    <div>
      {CONTACTS.map((contact) => {
        return <ContactCard key={contact.callId} contact={contact} />;
      })}
    </div>
  );
}

export default function RecentCallsPage({ locale }: any) {
  return (
    <Container
      style={{
        background: 'no-repeat url(/images/contacts_bg.svg) bottom center',
        backgroundSize: 'contain',
      }}
    >
      <Typography
        variant="h5"
        component="h1"
        style={{
          marginBottom: '12px',
          fontWeight: 700,
        }}
      >
        {STRINGS[locale].RECENT_TITLE}
      </Typography>
      <ContactCards />
    </Container>
  );
}
