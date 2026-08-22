const MESSAGES: Record<string, string> = {
  google_not_configured:
    "Google login is not configured for this environment. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  facebook_not_configured:
    "Facebook login is not configured for this environment. Add FACEBOOK_LOGIN_APP_ID and FACEBOOK_LOGIN_APP_SECRET, or Meta app credentials.",
  oauth_cancelled: "The social login was cancelled.",
  oauth_state: "The login session expired. Try Google or Facebook again.",
  oauth_provider: "That social login option is not available.",
  app_url_not_configured:
    "This deployment cannot build a login callback URL. Set APP_URL to the full site origin, for example https://vidlix.in.",
};

export function oauthErrorMessage(error: string | undefined) {
  if (!error) return null;
  return MESSAGES[error] ?? decodeURIComponent(error);
}

export function SocialAuthButtons({ intent }: { intent: "login" | "signup" }) {
  const action = intent === "signup" ? "Sign up" : "Continue";
  return (
    <div className="space-y-3">
      <a
        href={`/api/auth/oauth/google?intent=${intent}`}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-semibold transition hover:bg-background-secondary"
      >
        <GoogleMark />
        {action} with Google
      </a>
      <a
        href={`/api/auth/oauth/facebook?intent=${intent}`}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-semibold transition hover:bg-background-secondary"
      >
        <FacebookMark />
        {action} with Facebook
      </a>
      <p className="text-center text-xs text-muted">or use email</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6.1 12 6.1c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.2-1.5H12z"
      />
      <path fill="#4285F4" d="M20.8 12.3c0-.5-.1-1-.2-1.5H12v3.6h5.1c-.3 1.3-1.2 2.4-2.5 3.1l3.6 2.8c2.1-1.9 3.6-4.8 3.6-8z" />
      <path fill="#FBBC05" d="M6.4 14.3c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9L2.7 7.6C1.8 9.3 1.3 10.6 1.3 12s.5 2.7 1.4 4.4z" />
      <path fill="#34A853" d="M12 21.2c2.6 0 4.8-.9 6.4-2.3l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.2-4.6L1.4 16.4C3 19.6 7.2 21.2 12 21.2z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.98h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}
