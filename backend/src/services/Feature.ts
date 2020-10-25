const {
  CALL_LIMITS_ENABLED_NUMBERS = '',
  ENABLE_CALL_LIMIT_ALL,
  ENABLE_ALLOWLIST_SMS,
} = process.env;
const callLimitNumbers = CALL_LIMITS_ENABLED_NUMBERS.split(',').map(Number);

function shouldEnableCallLimits(userId: number) {
  return ENABLE_CALL_LIMIT_ALL || callLimitNumbers.includes(Number(userId));
}

function shouldEnableAllowlistSms() {
  return Boolean(ENABLE_ALLOWLIST_SMS);
}

export { shouldEnableCallLimits, shouldEnableAllowlistSms };
