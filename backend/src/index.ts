import path from 'path';
import express, { Request, Response } from 'express';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import 'express-async-errors';

// Separated to individual module so that .env values can be loaded and be available
// for other modules to use.
import './dotenv';

import {
  AllowlistEntry as allowlistRoutes,
  Call as callRoutes,
  CallToken as callTokenRoutes,
  Contact as contactRoutes,
  Feature as featureRoutes,
  OAuth as oauthRoutes,
  PeriodicCredit as periodicCreditRoutes,
  PhoneNumberValidation as phoneNumberValidationRoutes,
  Transaction as transactionRoutes,
  Twilio as twilioRoutes,
  User as userRoutes,
  WorkpassValidation as workpassValidationRoutes,
  middlewares,
} from './routes';
import {
  Passport as PassportConfig,
  Session as SessionConfig,
  logger,
  httpPinoConfig,
} from './config';

import './jobs';

const { secureRoutes, httpsRedirect, requireVerified } = middlewares;

const app = express();

type env = 'development' | 'production' | 'staging';

// Env vars
const { NODE_ENV } = process.env as { NODE_ENV: env };
const { PORT = 4000, STATIC_DIR = 'static' } = process.env;

app.use(morgan('dev'));
app.use(pinoHttp(httpPinoConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Configure sessions with passport. SessionConfig must be applied first
SessionConfig(app);
PassportConfig(app);

// TODO This is not great
if (NODE_ENV === 'production' || NODE_ENV === 'staging') {
  app.use(httpsRedirect);
  app.use(helmet());
}

// Make sure oauth is first and NOT secured
app.use('/oauth', oauthRoutes);

// TODO Features are a bit weird because we have per-user config. We probably want features for non logged in users too. Should probably use a different middleware for this
app.use('/features', secureRoutes, featureRoutes);
// TODO For backwards-compatibility
app.use('/passwordless', secureRoutes, phoneNumberValidationRoutes);
app.use('/phone-number-validation', secureRoutes, phoneNumberValidationRoutes);
app.use(
  '/workpass-validation',
  secureRoutes,
  requireVerified,
  workpassValidationRoutes
);

// Also ensure that twilio is NOT secured by oauth, just twilio auth
app.use('/twilio', twilioRoutes);

app.use('/users', secureRoutes, userRoutes);
app.use('/call-token', secureRoutes, requireVerified, callTokenRoutes);
app.use('/users', secureRoutes, requireVerified, contactRoutes);
app.use('/users', secureRoutes, requireVerified, callRoutes);
app.use('/users', secureRoutes, requireVerified, transactionRoutes);
app.use('/allowlistEntries', secureRoutes, allowlistRoutes);
app.use('/periodic-credit', secureRoutes, periodicCreditRoutes);

if (NODE_ENV === 'development') {
  // proxy requests to development frontend
  app.use('/', proxy('http://localhost:3000'));
} else {
  // STATIC_DIR gets populated in a docker build
  app.use(express.static(STATIC_DIR));
}

// Redirect everything else to index.html
app.use((_req: Request, res: Response) => {
  res.sendfile(path.join(STATIC_DIR, 'index.html'));
});

try {
  app.listen(PORT, () => {
    logger.info(`Example app listening on port ${PORT}!`);
  });
} catch (err) {
  logger.error(err);
  throw err;
}
