import React, { useEffect, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import {
  format,
  formatDistance,
  addSeconds,
  isToday,
  isYesterday,
} from 'date-fns';
import { useHistory, Redirect } from 'react-router-dom';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

import { withStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '../components/shared/Container';
import { getRecentCalls, RecentCall } from '../services/Call';
import { useUserService } from '../contexts';
import PATHS from './paths';

const EN_STRINGS = {
  RECENT_TITLE: 'Recent Calls',
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
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

const RecentCallsBox: any = withStyles((theme) => ({
  root: {
    backgroundColor: 'white',
    border: `1px solid ${theme.palette.grey[200]}`,
  },
}))(Box);

function prettyFormatDate(date: string, locale: string) {
  const dateObj = new Date(date);
  if (isToday(dateObj)) {
    return STRINGS[locale].TODAY;
  }
  if (isYesterday(dateObj)) {
    return STRINGS[locale].YESTERDAY;
  }
  return format(dateObj, 'dd MMM yyyy');
}

function CallCard({ call, locale }: { call: RecentCall; locale: string }) {
  const durationText = formatCallDuration(call.duration);
  return (
    <RecentCallsBox
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '4em',
      }}
    >
      <img
        style={{
          height: '2.5rem',
          width: '2.5rem',
          marginRight: '8px',
          marginLeft: '8px',
        }}
        alt=""
        src={`/images/avatars/${call.avatar || 'placeholder'}.svg`}
      />
      <div style={{ width: '100%', marginRight: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>{call.name}</Typography>
          <Typography>{prettyFormatDate(call.startTime, locale)}</Typography>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.675rem',
          }}
        >
          <Typography variant="body2">{call.phoneNumber}</Typography>
          <Typography variant="body2">{durationText}</Typography>
        </div>
      </div>
    </RecentCallsBox>
  );
}

function CallCards({ calls, locale }: { calls: RecentCall[]; locale: string }) {
  return (
    <div style={{ backgroundColor: 'white', overflow: 'scroll' }}>
      {calls.map((call) => {
        return <CallCard key={call.id} call={call} locale={locale} />;
      })}
    </div>
  );
}

function BackButton() {
  const history = useHistory();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
      onClick={() => {
        history.push(PATHS.CONTACTS);
      }}
      aria-hidden="true"
    >
      <ChevronLeftIcon />
      back
    </div>
  );
}

export default function RecentCallsPage({ locale }: any) {
  const [userState, userService] = useUserService();
  const { me: user } = userState || {};
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
      setUserId(String(user.id));
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
      <BackButton />
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
      <CallCards calls={calls} locale={locale} />
    </Container>
  );
}
