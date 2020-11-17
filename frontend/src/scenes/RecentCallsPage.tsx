import React, { useEffect, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import { format, formatDistance, addSeconds } from 'date-fns';
import CardContent from '@material-ui/core/CardContent';
import { Redirect } from 'react-router-dom';
import Container from '../components/shared/Container';
import { getRecentCalls, RecentCall } from '../services/Call';
import { useUserService } from '../contexts';
import PATHS from './paths';

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

function formatCallDuration(duration: number) {
  if (!duration) {
    return 'NA';
  }
  const helperDate1 = new Date();
  const helperDate2 = addSeconds(helperDate1, duration);
  return formatDistance(helperDate1, helperDate2);
}

function CallCard({ call }: { call: RecentCall }) {
  const durationText = formatCallDuration(call.duration);
  return (
    <Card style={{ marginBottom: 8 }}>
      <CardContent>
        <Typography>{call.name}</Typography>
        <Typography>{call.phoneNumber}</Typography>
        <Typography>
          {format(new Date(call.startTime), 'dd MMM yyyy')}
        </Typography>
        <Typography>{durationText}</Typography>
      </CardContent>
    </Card>
  );
}

function CallCards({ calls }: { calls: RecentCall[] }) {
  return (
    <div>
      {calls.map((call) => {
        return <CallCard key={call.id} call={call} />;
      })}
    </div>
  );
}

export default function RecentCallsPage({ locale }: any) {
  const [userState, userService] = useUserService();
  const { me: user } = userState;
  const [userId, setUserId] = useState<string>();
  const [calls, setCalls] = useState<RecentCall[]>([]);

  // Seems like user info is not persisting and requires getting data from endpoint again
  useEffect(() => {
    if (userService) {
      userService.refreshSelf();
    }
  }, [userService]);
  useEffect(() => {
    if (userId) {
      getRecentCalls(userId).then((recentCalls: RecentCall[]) =>
        setCalls(recentCalls)
      );
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  if (!user) {
    return <Redirect to={PATHS.RECENT} />;
  }

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
      <CallCards calls={calls} />
    </Container>
  );
}
