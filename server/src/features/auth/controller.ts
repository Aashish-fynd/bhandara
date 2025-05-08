import config from "@config";
import { supabase } from "@connections";
import { RequestContext } from "@contexts";
import { ICustomRequest } from "@definitions/types";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@exceptions";
import {
  deleteUserSessionCache,
  getSafeUser,
  getUserSessionCacheList,
  setUserCache,
  setUserSessionCache,
} from "@features/user/helpers";
import UserService from "@features/user/service";
import {
  getGeoLocationData,
  validatePassword,
  getAlphaNumericId,
} from "@helpers";
import logger from "@logger";
import { jnstringify } from "@utils";
import { Request, Response } from "express";
import { UAParser } from "ua-parser-js";

const userService = new UserService();

/**
 * Logins the user by creating a new access token
 * @param req Request object containing the request
 * @param res Response object containing the response
 */
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!(email && password)) {
    throw new BadRequestError("Username and password are required");
  }

  const { data: existingUser, error } = await userService.getUserByEmail(email);
  if (error) throw new Error(error.message);

  if (!existingUser)
    throw new NotFoundError(`User not found with email: ${email}`);

  const isPasswordValid = await validatePassword(
    existingUser.password,
    password
  );

  if (!existingUser || !isPasswordValid)
    throw new UnauthorizedError("Invalid credentials provided");

  // TODO: Add if required
  // const token = await signJWTPayload(existingUser);

  res.cookie(config.cookie.keyName, getAlphaNumericId(), {
    maxAge: 30 * 60 * 24 * 60 * 1000,
  });

  return res.status(200).json({
    data: { user: existingUser },
    success: true,
  });
};

const logOut = async (req: ICustomRequest, res: Response) => {
  await deleteUserSessionCache(req.user.id, req.cookies[config.cookie.keyName]);
  res.clearCookie(config.cookie.keyName);
  return res.status(200).json({ data: "Logout successful", success: true });
};

const session = (req: ICustomRequest, res: Response) => {
  const { user } = req;

  return res.status(200).json({ data: user });
};

const googleAuth = async (req: Request, res: Response) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const redirectUrl = `${origin}/auth/google/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl },
  });

  if (error) throw new Error(error.message);

  return res.redirect(data.url);
};

const googleCallback = async (req: Request, res: Response) => {
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    req.query.code as string
  );

  if (error) throw new Error(error.message);

  const { user, session } = data;

  RequestContext.setContextValue("session", {
    accessToken: session?.access_token,
    refreshToken: session?.refresh_token,
  });

  let { data: existingUser, error: userError } =
    await userService.getUserByEmail(user.email);

  if (userError) throw new Error(userError.message);
  // Extract IP and location info
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress;
  let geoLocationData = await getGeoLocationData(ip);

  if (!existingUser) {
    // create new user
    const newUserData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata.full_name,
      gender: "-", // will be updated later
      address: geoLocationData,
      isVerified: true,
      profilePic: {
        url: user.user_metadata.avatar_url,
        provider: "google",
      },
      mediaId: null,
      meta: {
        auth: {
          authProvider: "google",
          accessToken: session?.access_token,
          refreshToken: session?.refresh_token,
        },
      },
    };

    const { data: newUser, error: newUserError } = await userService.create(
      newUserData
    );

    if (newUserError) throw new Error(newUserError.message);
    existingUser = newUser?.[0];
  }
  existingUser = getSafeUser(existingUser);
  await setUserCache(existingUser.id, existingUser, 3600 * 24 * 30 * 30);
  // Extract device metadata
  const userAgent = req.headers["user-agent"] || "";
  const parser = new UAParser();
  const deviceInfo = parser.setUA(userAgent).getResult();

  const finalUserAgent = {
    device: {
      model: deviceInfo.device.model,
      vendor: deviceInfo.device.vendor,
    },
    os: {
      name: deviceInfo.os.name,
      version: deviceInfo.os.version,
    },
    browser: deviceInfo.browser.name,
    ua: deviceInfo.ua,
  };

  const sessionDataToSave = {
    accessToken: session?.access_token,
    refreshToken: session?.refresh_token,
    userAgent: finalUserAgent,
    location: geoLocationData,
    user: { id: existingUser.id },
  };

  const sessionId = getAlphaNumericId();

  await setUserSessionCache({
    userId: existingUser.id,
    sessionId,
    data: sessionDataToSave,
    ttl: 60 * 60 * 24 * 30 * 30,
  });

  res.cookie(config.cookie.keyName, sessionId, {
    maxAge: 60 * 60 * 24 * 30,
  });

  return res.json({
    data: {
      session: { id: sessionId, user: existingUser },
    },
    success: true,
  });
};

export const sessionsList = async (req: ICustomRequest, res: Response) => {
  const sessions = await getUserSessionCacheList(req.user.id);
  return res.status(200).json({ data: sessions });
};

export const deleteSession = async (req: ICustomRequest, res: Response) => {
  const { sessionId } = req.params;
  await deleteUserSessionCache(req.user.id, sessionId);
  return res.status(200).json({ data: "Session deleted", success: true });
};

export { login, logOut, session, googleAuth, googleCallback };
