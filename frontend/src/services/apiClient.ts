/* eslint-disable max-classes-per-file */
import axios, { AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/react';

export class UnauthenticatedError extends Error {}

export class ApiDataError<T> extends Error {
  data: T;

  constructor(apiData: T) {
    super();
    this.data = apiData;
  }
}

export class ApiValidationError extends Error {
  code: string;

  constructor(message: string) {
    super();
    this.code = message.replace(ApiValidationError.validationErrorPrefix, '');
  }

  static validationErrorPrefix = 'Validation Error: ';

  static isValidationErrorMessage(message: string) {
    return message.startsWith(ApiValidationError.validationErrorPrefix);
  }
}

function unwrapResponseInterceptor<T>(
  response: AxiosResponse<T>
): T | AxiosResponse<T> {
  if (response && response.data) {
    return response.data;
  }
  return response;
}

async function unauthenticatedRedirectInterceptor(error: AxiosError) {
  const { response } = error;
  if (!response || response.status !== 401) {
    throw error;
  }
  // There is a response, it is 401 and there is a redirect location
  window.location = response.data.location;
}

async function unauthenticatedThrowInterceptor(error: AxiosError) {
  const { response } = error;
  if (!response || response.status !== 401 || !response.data.location) {
    throw error;
  }
  // Error has a response and it is a 401.
  throw new UnauthenticatedError('Unauthenticated');
}

async function badRequestInterceptor(error: AxiosError) {
  const { response } = error;
  if (!response || response.status !== 400) {
    return Promise.reject(error);
  }
  // 400 is a bad request, we alert the users somehow but do not report to Sentry.
  if (
    typeof response.data === 'string' &&
    ApiValidationError.isValidationErrorMessage(response.data)
  ) {
    throw new ApiValidationError(response.data);
  }
  throw new ApiDataError(response.data);
}

async function apiDataErrorInterceptor(error: AxiosError) {
  // this should be next to last because it will swallow every error that has data attached to it
  const { response } = error;
  if (!response || !response.data) {
    throw error;
  }
  Sentry.captureException(error);
  throw new ApiDataError(response.data);
}

async function defaultErrorInterceptor(error: AxiosError) {
  // Absolutely last interceptor. Capture the exception and throw.
  // This means that the request never reached the backend, could be due to CORS, bad gateway, etc.
  Sentry.captureException(error);
  throw error;
}

const apiClient = axios.create();
axiosRetry(apiClient);
apiClient.interceptors.response.use(unwrapResponseInterceptor);
[
  unauthenticatedRedirectInterceptor,
  badRequestInterceptor,
  apiDataErrorInterceptor,
  defaultErrorInterceptor,
].forEach((errorInterceptor) =>
  apiClient.interceptors.response.use(undefined, errorInterceptor)
);

export default apiClient;

// Expose a version that doesn't automatically redirect in case the caller needs to make use of the unauthenticated status.
export const noRedirectClient = axios.create();
axiosRetry(noRedirectClient);
noRedirectClient.interceptors.response.use(unwrapResponseInterceptor);
[
  unauthenticatedThrowInterceptor,
  badRequestInterceptor,
  apiDataErrorInterceptor,
  defaultErrorInterceptor,
].forEach((errorInterceptor) =>
  noRedirectClient.interceptors.response.use(undefined, errorInterceptor)
);
