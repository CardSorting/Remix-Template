import {
  createHotContext
} from "/build/_shared/chunk-JGV3INUP.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:@remix-run/node
var require_node = __commonJS({
  "empty-module:@remix-run/node"(exports, module) {
    module.exports = {};
  }
});

// app/services/Auth0Service.ts
var import_node = __toESM(require_node());
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/services/Auth0Service.ts"
  );
  import.meta.hot.lastModified = "1723509163655.4893";
}
var Auth0Service = class {
  constructor(domain, clientId, clientSecret, audience, callbackUrl, logoutReturnTo, sessionSecret) {
    this.domain = domain;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.audience = audience;
    this.callbackUrl = callbackUrl;
    this.logoutReturnTo = logoutReturnTo;
    this.sessionStorage = (0, import_node.createCookieSessionStorage)({
      cookie: {
        name: "_auth",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: [sessionSecret],
        secure: false,
        maxAge: 60 * 60 * 24 * 30
        // 30 days
      }
    });
  }
  async getUser(request) {
    const session = await this.getUserSession(request);
    if (!session.accessToken)
      return null;
    try {
      return await this.verifyToken(session.accessToken);
    } catch (error) {
      console.error("Error verifying token:", error);
      return null;
    }
  }
  async getUserAndAdminStatus(request) {
    var _a;
    const session = await this.getUserSession(request);
    if (!session.accessToken)
      return null;
    try {
      const user = await this.verifyToken(session.accessToken);
      if (!user)
        return null;
      return { user, isAdmin: (_a = session.isAdmin) != null ? _a : false };
    } catch (error) {
      console.error("Error getting user and admin status:", error);
      return null;
    }
  }
  async verifyAdmin(request) {
    var _a;
    const session = await this.getUserSession(request);
    return (_a = session.isAdmin) != null ? _a : false;
  }
  getLoginUrl(state) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: "openid profile email",
      audience: this.audience
    });
    if (state) {
      params.append("state", state);
    }
    return `https://${this.domain}/authorize?${params.toString()}`;
  }
  async handleLogin(request) {
    const session = await this.sessionStorage.getSession();
    const state = crypto.randomUUID();
    session.set("auth_state", state);
    return (0, import_node.redirect)(this.getLoginUrl(state), {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session)
      }
    });
  }
  async handleCallback(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code) {
      throw new Error("No code provided in callback");
    }
    const session = await this.sessionStorage.getSession(request.headers.get("Cookie"));
    const savedState = session.get("auth_state");
    if (!state || state !== savedState) {
      throw new Error("Invalid state parameter");
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
        isAdmin
      }, "/dashboard");
    } catch (error) {
      console.error("Error handling callback:", error);
      return (0, import_node.redirect)("/login?error=AuthCallbackFailed");
    }
  }
  async refreshTokens(request) {
    const session = await this.getUserSession(request);
    if (!session.refreshToken)
      return null;
    try {
      const tokenResponse = await this.refreshToken(session.refreshToken);
      const user = await this.verifyToken(tokenResponse.access_token);
      if (!user)
        throw new Error("Failed to verify user after token refresh");
      const isAdmin = this.isAdmin(user);
      return this.createUserSession({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
        expiresIn: tokenResponse.expires_in,
        userId: user.sub,
        isAdmin
      }, request.url);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      return this.logout(request);
    }
  }
  async refreshToken(refreshToken) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });
    return this.fetchToken(body);
  }
  getLogoutUrl() {
    return `https://${this.domain}/v2/logout?client_id=${this.clientId}&returnTo=${encodeURIComponent(this.logoutReturnTo)}`;
  }
  async logout(request) {
    const session = await this.sessionStorage.getSession(request.headers.get("Cookie"));
    return (0, import_node.redirect)(this.getLogoutUrl(), {
      headers: {
        "Set-Cookie": await this.sessionStorage.destroySession(session)
      }
    });
  }
  async requireUser(request) {
    const user = await this.getUser(request);
    if (!user) {
      throw (0, import_node.redirect)("/login");
    }
    return user;
  }
  async requireAdmin(request) {
    const isAdmin = await this.verifyAdmin(request);
    if (!isAdmin) {
      throw (0, import_node.redirect)("/unauthorized");
    }
  }
  adminMiddleware(loader) {
    return async (args) => {
      try {
        await this.requireAdmin(args.request);
        return loader(args);
      } catch (error) {
        if (error instanceof Response && error.status === 302) {
          return error;
        }
        return (0, import_node.json)({ error: "Unauthorized" }, { status: 403 });
      }
    };
  }
  async updateUserProfile(accessToken, updates) {
    const response = await fetch(`https://${this.domain}/api/v2/users/${updates.sub}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error("Failed to update user profile");
    }
    return response.json();
  }
  async getUserRoles(accessToken, userId) {
    const response = await fetch(`https://${this.domain}/api/v2/users/${userId}/roles`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user roles");
    }
    const roles = await response.json();
    return roles.map((role) => role.name);
  }
  async getUserSession(request) {
    const session = await this.sessionStorage.getSession(request.headers.get("Cookie"));
    return {
      accessToken: session.get("accessToken"),
      refreshToken: session.get("refreshToken"),
      idToken: session.get("idToken"),
      expiresAt: session.get("expiresAt"),
      userId: session.get("userId"),
      isAdmin: session.get("isAdmin"),
      auth_state: session.get("auth_state")
    };
  }
  async createUserSession({
    accessToken,
    refreshToken,
    idToken,
    expiresIn,
    userId,
    isAdmin
  }, redirectTo) {
    const session = await this.sessionStorage.getSession();
    session.set("accessToken", accessToken);
    session.set("refreshToken", refreshToken);
    session.set("idToken", idToken);
    session.set("expiresAt", Date.now() + expiresIn * 1e3);
    session.set("userId", userId);
    session.set("isAdmin", isAdmin);
    return (0, import_node.redirect)(redirectTo, {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session)
      }
    });
  }
  async exchangeCodeForTokens(code) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.callbackUrl
    });
    const tokenResponse = await this.fetchToken(body);
    const user = await this.verifyToken(tokenResponse.access_token);
    if (!user) {
      throw new Error("Failed to retrieve user information after login");
    }
    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      expiresIn: tokenResponse.expires_in,
      user
    };
  }
  async verifyToken(token) {
    try {
      const response = await fetch(`https://${this.domain}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to verify token with Auth0");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to verify token with Auth0:", error);
      return null;
    }
  }
  async fetchToken(body) {
    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    if (!response.ok) {
      throw new Error("Failed to obtain token from Auth0");
    }
    return await response.json();
  }
  isAdmin(user) {
    const roles = user[`https://${this.domain}/roles`];
    return Array.isArray(roles) ? roles.includes("admin") : false;
  }
};
var auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN,
  process.env.AUTH0_CLIENT_ID,
  process.env.AUTH0_CLIENT_SECRET,
  process.env.AUTH0_AUDIENCE,
  process.env.AUTH0_CALLBACK_URL,
  process.env.AUTH0_LOGOUT_RETURN_TO,
  process.env.SESSION_SECRET
);

export {
  require_node,
  Auth0Service
};
//# sourceMappingURL=/build/_shared/chunk-3WZLLD32.js.map
