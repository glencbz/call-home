import React from 'react';
import { Switch, Route } from 'react-router-dom';
import PATHS from './paths';
import {
  AdminPage,
  Login,
  CallingPage,
  ContactsPage,
  TransactionsPage,
  VerifyPhoneNumber,
  VerifyPhoneNumberCode,
  RecentCallsPage,
} from './index';

export default function SceneRouter() {
  // TODO replace this with a proper switching logic
  const queryLang = window.location.search.startsWith('?lang=')
    ? window.location.search.substr(6, 2)
    : null;
  const localStorageLang = localStorage.getItem('lang');
  if (queryLang) {
    localStorage.setItem('lang', queryLang);
  }
  const locale = queryLang || localStorageLang || 'en';

  return (
    <Switch>
      <Route path={PATHS.ADMIN}>
        <AdminPage locale={locale} />
      </Route>
      <Route path={PATHS.VERIFY_PHONE_NUMBER_CODE}>
        <VerifyPhoneNumberCode locale={locale} />
      </Route>
      <Route path={PATHS.VERIFY_PHONE_NUMBER}>
        <VerifyPhoneNumber locale={locale} />
      </Route>
      <Route path={PATHS.CALLING}>
        <CallingPage locale={locale} />
      </Route>
      <Route path={PATHS.CONTACTS}>
        <ContactsPage locale={locale} />
      </Route>
      <Route path={PATHS.TRANSACTIONS}>
        <TransactionsPage locale={locale} />
      </Route>
      <Route path={PATHS.RECENT}>
        <RecentCallsPage locale={locale} />
      </Route>
      <Route path={PATHS.LOGIN}>
        <Login locale={locale} />
      </Route>
    </Switch>
  );
}
