/**
 * Cookies must carry the Secure flag anywhere that is not local development.
 *
 * Keying this off APP_ENV alone was wrong: an APP_ENV set to the empty string
 * in a hosting dashboard made `APP_ENV === "production"` false in production,
 * which quietly dropped Secure from the session cookie.
 */
export function secureCookies() {
  if (process.env.NODE_ENV === "development") return false;
  if (process.env.APP_ENV === "development") return false;
  return true;
}
