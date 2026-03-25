import * as client from "openid-client";
import memoize from "memoizee";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

function getBaseUrl() {
  return process.env.REPLIT_DEPLOYMENT
    ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
    : `https://${process.env.REPLIT_DEV_DOMAIN}`;
}

function getCallbackUrl() {
  return `${getBaseUrl()}/api/callback`;
}

const getOidcConfig = memoize(
  async () => {
    const issuer = new URL("https://replit.com");
    const config = await client.discovery(issuer, process.env.REPL_ID);
    return config;
  },
  { promise: true, maxAge: 3600000 }
);

export async function getUserInfo(req, res) {
  if (!req.session.userId) {
    return res.json(null);
  }
  return res.json({
    id: req.session.userId,
    name: req.session.userName,
    profileImage: req.session.userProfileImage
  });
}

export async function login(req, res) {
  try {
    const config = await getOidcConfig();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    
    const redirectUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: getCallbackUrl(),
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state
    });
    
    res.redirect(redirectUrl.href);
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/?error=login_failed");
  }
}

export async function callback(req, res) {
  try {
    const config = await getOidcConfig();
    const currentUrl = new URL(req.url, getBaseUrl());
    
    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      expectedState: req.session.state,
      pkceCodeVerifier: req.session.codeVerifier
    });
    
    const userInfo = await client.fetchUserInfo(config, tokens.access_token, tokens.claims().sub);
    
    req.session.userId = userInfo.sub;
    req.session.userName = userInfo.name || userInfo.preferred_username || "User";
    req.session.userProfileImage = userInfo.picture || userInfo.profile;
    
    delete req.session.codeVerifier;
    delete req.session.state;
    
    res.redirect("/");
  } catch (err) {
    console.error("Auth callback error:", err);
    res.redirect("/?error=auth_failed");
  }
}

export async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.redirect("/");
  });
}

export function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}
