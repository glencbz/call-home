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
  VerifyWorkpass,
} from '.';
import { Locale } from './types';

export default function SceneRouter() {
  // TODO replace this with a proper switching logic
  const queryLang = window.location.search.startsWith('?lang=')
    ? window.location.search.substr(6, 2)
    : null;
  const localStorageLang = localStorage.getItem('lang');
  if (queryLang) {
    localStorage.setItem('lang', queryLang);
  }
  const locale: Locale =
    (queryLang as Locale) || (localStorageLang as Locale) || 'en';

  return (
    <Switch>
      <Route path={PATHS.ADMIN}>
        <AdminPage locale={locale} routePath={PATHS.ADMIN} />
      </Route>
      <Route path={PATHS.VERIFY_PHONE_NUMBER_CODE}>
        <VerifyPhoneNumberCode
          locale={locale}
          routePath={PATHS.VERIFY_PHONE_NUMBER_CODE}
        />
      </Route>
      <Route path={PATHS.VERIFY_PHONE_NUMBER}>
        <VerifyPhoneNumber
          locale={locale}
          routePath={PATHS.VERIFY_PHONE_NUMBER}
        />
      </Route>
      <Route path={PATHS.VERIFY_WORKPASS}>
        <VerifyWorkpass locale={locale} routePath={PATHS.VERIFY_WORKPASS} />
      </Route>
      <Route path={PATHS.CALLING}>
        <CallingPage locale={locale} routePath={PATHS.CALLING} />
      </Route>
      <Route path={PATHS.CONTACTS}>
        <ContactsPage locale={locale} routePath={PATHS.CONTACTS} />
      </Route>
      <Route path={PATHS.TRANSACTIONS}>
        <TransactionsPage />
      </Route>
      <Route path={PATHS.RECENT}>
        <RecentCallsPage locale={locale} />
      </Route>
      <Route path={PATHS.LOGIN}>
        <Login locale={locale} routePath={PATHS.LOGIN} />
      </Route>
    </Switch>
  );
}
