import { createCookieSessionStorage, redirect, json } from '@remix-run/node';
import type { SessionStorage } from '@remix-run/node';

export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface Auth0TokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export interface Auth0Session {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user: Auth0User;
}

type SessionData = {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  userId?: string;
  isAdmin?: boolean;
  auth_state?: string;
};

type SessionFlashData = {
  error: string;
};

export class Auth0Service {
  private readonly domain: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;
  private readonly callbackUrl: string;
  private readonly logoutReturnTo: string;
  private readonly sessionStorage: SessionStorage<SessionData, SessionFlashData>;

  constructor(
    domain: string,
    clientId: string,
    clientSecret: string,
    audience: string,
    callbackUrl: string,
    logoutReturnTo: string,
    sessionSecret: string
  ) {
    this.domain = domain;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.audience = audience;
    this.callbackUrl = callbackUrl;
    this.logoutReturnTo = logoutReturnTo;
    this.sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
      cookie: {
        name: '_auth',
        sameSite: 'lax',
        path: '/',
        httpOnly: true,
        secrets: [sessionSecret],
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    });
  }

  async getUser(request: Request): Promise<Auth0User | null> {
    const session = await this.getUserSession(request);
    if (!session.accessToken) return null;
    try {
      return await this.verifyToken(session.accessToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  async getUserAndAdminStatus(request: Request): Promise<{ user: Auth0User; isAdmin: boolean } | null> {
    const session = await this.getUserSession(request);
    if (!session.accessToken) return null;
    try {
      const user = await this.verifyToken(session.accessToken);
      if (!user) return null;
      return { user, isAdmin: session.isAdmin ?? false };
    } catch (error) {
      console.error('Error getting user and admin status:', error);
      return null;
    }
  }

  async verifyAdmin(request: Request): Promise<boolean> {
    const session = await this.getUserSession(request);
    return session.isAdmin ?? false;
  }

  getLoginUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'openid profile email',
      audience: this.audience,
    });
    if (state) {
      params.append('state', state);
    }
    return `https://${this.domain}/authorize?${params.toString()}`;
  }

  async handleLogin(request: Request): Promise<Response> {
    const session = await this.sessionStorage.getSession();
    const state = crypto.randomUUID();
    session.set('auth_state', state);
    return redirect(this.getLoginUrl(state), {
      headers: {
        'Set-Cookie': await this.sessionStorage.commitSession(session),
      },
    });
  }

  async handleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      throw new Error('No code provided in callback');
    }

    const session = await this.sessionStorage.getSession(request.headers.get('Cookie'));
    const savedState = session.get('auth_state');

    if (!state || state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    try {
      const { accessToken, refreshToken, idToken, expiresIn, user } = await this.exchangeCodeForTokens(code);
      const isAdmin = this.isAdmin(user);
      return this.createUserSession({
        accessToken,
        refreshToken,
        idToken,
        expiresIn,
        userId: user.sub,
        isAdmin,
      }, '/dashboard');
    } catch (error) {
      console.error('Error handling callback:', error);
      return redirect('/login?error=AuthCallbackFailed');
    }
  }

  async refreshTokens(request: Request): Promise<Response | null> {
    const session = await this.getUserSession(request);
    if (!session.refreshToken) return null;

    try {
      const tokenResponse = await this.refreshToken(session.refreshToken);
      const user = await this.verifyToken(tokenResponse.access_token);
      if (!user) throw new Error('Failed to verify user after token refresh');

      const isAdmin = this.isAdmin(user);
      return this.createUserSession({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
        expiresIn: tokenResponse.expires_in,
        userId: user.sub,
        isAdmin,
      }, request.url);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return this.logout(request);
    }
  }

  async refreshToken(refreshToken: string): Promise<Auth0TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });
    return this.fetchToken(body);
  }

  getLogoutUrl(): string {
    return `https://${this.domain}/v2/logout?client_id=${this.clientId}&returnTo=${encodeURIComponent(this.logoutReturnTo)}`;
  }

  async logout(request: Request): Promise<Response> {
    const session = await this.sessionStorage.getSession(request.headers.get('Cookie'));
    return redirect(this.getLogoutUrl(), {
      headers: {
        'Set-Cookie': await this.sessionStorage.destroySession(session),
      },
    });
  }

  async requireUser(request: Request): Promise<Auth0User> {
    const user = await this.getUser(request);
    if (!user) {
      throw redirect('/login');
    }
    return user;
  }

  async requireAdmin(request: Request): Promise<void> {
    const isAdmin = await this.verifyAdmin(request);
    if (!isAdmin) {
      throw redirect('/unauthorized');
    }
  }

  adminMiddleware(loader: (args: { request: Request; params: Record<string, string> }) => Promise<Response>) {
    return async (args: { request: Request; params: Record<string, string> }) => {
      try {
        await this.requireAdmin(args.request);
        return loader(args);
      } catch (error) {
        if (error instanceof Response && error.status === 302) {
          return error;
        }
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
    };
  }

  async updateUserProfile(accessToken: string, updates: Partial<Auth0User>): Promise<Auth0User> {
    const response = await fetch(`https://${this.domain}/api/v2/users/${updates.sub}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }

    return response.json();
  }

  async getUserRoles(accessToken: string, userId: string): Promise<string[]> {
    const response = await fetch(`https://${this.domain}/api/v2/users/${userId}/roles`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user roles');
    }

    const roles = await response.json();
    return roles.map((role: { name: string }) => role.name);
  }

  private async getUserSession(request: Request): Promise<SessionData> {
    const session = await this.sessionStorage.getSession(request.headers.get('Cookie'));
    return {
      accessToken: session.get('accessToken'),
      refreshToken: session.get('refreshToken'),
      idToken: session.get('idToken'),
      expiresAt: session.get('expiresAt'),
      userId: session.get('userId'),
      isAdmin: session.get('isAdmin'),
      auth_state: session.get('auth_state'),
    };
  }

  private async createUserSession(
    {
      accessToken,
      refreshToken,
      idToken,
      expiresIn,
      userId,
      isAdmin,
    }: {
      accessToken: string;
      refreshToken?: string;
      idToken?: string;
      expiresIn: number;
      userId: string;
      isAdmin: boolean;
    },
    redirectTo: string
  ): Promise<Response> {
    const session = await this.sessionStorage.getSession();
    session.set('accessToken', accessToken);
    session.set('refreshToken', refreshToken);
    session.set('idToken', idToken);
    session.set('expiresAt', Date.now() + expiresIn * 1000);
    session.set('userId', userId);
    session.set('isAdmin', isAdmin);
    return redirect(redirectTo, {
      headers: {
        'Set-Cookie': await this.sessionStorage.commitSession(session),
      },
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn: number;
    user: Auth0User;
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.callbackUrl,
    });

    const tokenResponse = await this.fetchToken(body);
    const user = await this.verifyToken(tokenResponse.access_token);

    if (!user) {
      throw new Error('Failed to retrieve user information after login');
    }

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      expiresIn: tokenResponse.expires_in,
      user,
    };
  }

  private async verifyToken(token: string): Promise<Auth0User | null> {
    try {
      const response = await fetch(`https://${this.domain}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to verify token with Auth0');
      }

      return await response.json() as Auth0User;
    } catch (error) {
      console.error('Failed to verify token with Auth0:', error);
      return null;
    }
  }

  private async fetchToken(body: URLSearchParams): Promise<Auth0TokenResponse> {
    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to obtain token from Auth0');
    }

    return await response.json() as Auth0TokenResponse;
  }

  private isAdmin(user: Auth0User): boolean {
    const roles = user[`https://${this.domain}/roles`];
    return Array.isArray(roles) ? roles.includes('admin') : false;
  }
}

// Usage example:
export const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE!,
  process.env.AUTH0_CALLBACK_URL!,
  process.env.AUTH0_LOGOUT_RETURN_TO!,
  process.env.SESSION_SECRET!
);