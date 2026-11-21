import { environment } from '../environments/environment';

/** All backend endpoints live here. Add new APIs below. */
const base = environment.apiBaseUrl;

export const URLS = {
  auth: {
    identity: `${base}/auth/identity`, // register + login (after Google OAuth)
  },
} as const;

/** Third-party endpoints. */
export const EXTERNAL_URLS = {
  googleUserInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
} as const;
