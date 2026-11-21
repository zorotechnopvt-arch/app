import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../environments/environment';
import { URLS, EXTERNAL_URLS } from '../urls';

/** Same shape as Google's /oauth2/v2/userinfo response, which /auth/identity expects. */
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/** Minimal typings for Google Identity Services (loaded from accounts.google.com/gsi/client). */
interface GisTokenResponse { access_token?: string; error?: string; error_description?: string }
interface GisTokenClient { requestAccessToken(overrides?: { prompt?: string }): void }
declare const google: {
  accounts: {
    oauth2: {
      initTokenClient(cfg: {
        client_id: string;
        scope: string;
        callback: (r: GisTokenResponse) => void;
        error_callback?: (e: { type: string; message?: string }) => void;
      }): GisTokenClient;
    };
  };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private initialized?: Promise<void>;
  private gisLoaded?: Promise<void>;

  constructor(private http: HttpClient) {
    // Preload so the popup can open instantly (and isn't blocked) on click.
    if (!Capacitor.isNativePlatform()) this.loadGis().catch(() => undefined);
  }

  private loadGis(): Promise<void> {
    this.gisLoaded ??= new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = 'https://accounts.google.com/gsi/client';
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => { this.gisLoaded = undefined; reject(new Error('Could not load Google sign-in')); };
      document.head.appendChild(el);
    });
    return this.gisLoaded;
  }

  /** Web: Google popup (no page redirect, no redirect URI). Resolves with an access token. */
  private async webAccessToken(): Promise<string> {
    await this.loadGis();
    return new Promise<string>((resolve, reject) => {
      google.accounts.oauth2
        .initTokenClient({
          client_id: environment.googleWebClientId,
          scope: 'openid email profile',
          callback: (r) =>
            r.access_token ? resolve(r.access_token) : reject(new Error(r.error_description || r.error || 'Google sign-in failed')),
          error_callback: (e) => reject(new Error(e.message || e.type)),
        })
        .requestAccessToken({ prompt: 'select_account' });
    });
  }

  private init(): Promise<void> {
    this.initialized ??= SocialLogin.initialize({
      google: { webClientId: environment.googleWebClientId },
    });
    return this.initialized;
  }

  /** Google OAuth, then register-or-login against the backend. Returns the backend response. */
  async signInWithGoogle(): Promise<unknown> {
    const user = Capacitor.isNativePlatform() ? await this.nativeUserInfo() : await this.webUserInfo();
    const session = environment.useMockApi
      ? { mock: true, token: 'mock-token', user }
      : await firstValueFrom(this.http.post(URLS.auth.identity, user));
    this.saveSession(session);
    this.saveUser(user);
    return session;
  }

  /**
   * Email + password sign-in. For now only the temporary dev credentials in the environment file work
   * (they are null in production). Replace with a real API call when the backend has a login endpoint.
   */
  async signInWithPassword(email: string, password: string): Promise<boolean> {
    const m = environment.mockLogin;
    if (!m || email.trim().toLowerCase() !== m.email.toLowerCase() || password !== m.password) return false;
    const user: GoogleUserInfo = {
      id: 'mock-user', email: m.email, verified_email: true,
      name: 'Hello User', given_name: 'Hello', family_name: 'User', picture: '',
    };
    this.saveSession({ mock: true, token: 'mock-token', user });
    this.saveUser(user);
    return true;
  }

  /** Google profile of the signed-in user, or null. */
  getUser(): GoogleUserInfo | null {
    try {
      const raw = localStorage.getItem('zoro_user');
      return raw ? (JSON.parse(raw) as GoogleUserInfo) : null;
    } catch {
      return null;
    }
  }

  signOut() {
    try {
      localStorage.removeItem('zoro_session');
      localStorage.removeItem('zoro_user');
    } catch { /* ignore */ }
  }

  private async webUserInfo(): Promise<GoogleUserInfo> {
    const token = await this.webAccessToken();
    const resp = await fetch(EXTERNAL_URLS.googleUserInfo, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error('Could not read Google profile');
    return (await resp.json()) as GoogleUserInfo;
  }

  /** Android / iOS via the native plugin (client IDs still to be configured). */
  private async nativeUserInfo(): Promise<GoogleUserInfo> {
    await this.init();
    const res = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['email', 'profile'] },
    });
    const result = res.result;
    if (result.responseType !== 'online') {
      throw new Error('Unexpected Google login response');
    }
    return this.loadUserInfo(result);
  }

  private async loadUserInfo(result: {
    accessToken: { token: string } | null;
    profile: {
      id: string | null; email: string | null; name: string | null;
      givenName: string | null; familyName: string | null; imageUrl: string | null;
    };
  }): Promise<GoogleUserInfo> {
    // Prefer Google's userinfo so the body matches the backend contract exactly.
    if (result.accessToken?.token) {
      const resp = await fetch(EXTERNAL_URLS.googleUserInfo, {
        headers: { Authorization: `Bearer ${result.accessToken.token}` },
      });
      if (resp.ok) return (await resp.json()) as GoogleUserInfo;
    }
    const p = result.profile;
    return {
      id: p.id ?? '',
      email: p.email ?? '',
      verified_email: true,
      name: p.name ?? '',
      given_name: p.givenName ?? '',
      family_name: p.familyName ?? '',
      picture: p.imageUrl ?? '',
    };
  }

  private saveUser(user: GoogleUserInfo) {
    try { localStorage.setItem('zoro_user', JSON.stringify(user)); } catch { /* ignore */ }
  }

  private saveSession(session: unknown) {
    try { localStorage.setItem('zoro_session', JSON.stringify(session)); } catch { /* ignore */ }
  }
}
