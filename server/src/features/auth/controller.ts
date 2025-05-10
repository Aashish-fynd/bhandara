import config from "@config";
import { supabase } from "@connections";
import { ESocialLoginProvider } from "@definitions/enums";
import { ICustomRequest } from "@definitions/types";
import { BadRequestError, NotFoundError } from "@exceptions";
import { AuthService } from "@features";
import {
  deleteUserSessionCache,
  getUserSessionCacheList,
} from "@features/user/helpers";
import UserService from "@features/user/service";
import { isEmpty } from "@utils";
import { Request, Response } from "express";

const authService = new AuthService();
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

  const { data: existingUser } = await userService.getUserByEmail(email);

  if (!existingUser)
    throw new NotFoundError(`User not found with email: ${email}`);

  const loginProvider = existingUser.meta.auth.authProvider;
  const isSocialLoggedInUser =
    Object.values(ESocialLoginProvider).includes(loginProvider);

  if (isSocialLoggedInUser) {
    throw new BadRequestError(
      `User signed in with ${loginProvider}, please login with the same ${loginProvider}`
    );
  }

  // TODO: Add if required
  // const token = await signJWTPayload(existingUser);

  const sessionData = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const { sessionId, user } = await authService.createPlatformUser({
    req,
    sessionData: sessionData,
    existingUser,
  });

  res.cookie(config.cookie.keyName, sessionId, {
    maxAge: 30 * 60 * 24 * 60 * 1000,
  });

  return res.status(200).json({
    data: { session: { id: sessionId, user } },
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
  const exchangeCodeResponse = await supabase.auth.exchangeCodeForSession(
    req.query.code as string
  );

  const { sessionId, user } = await authService.createPlatformUser({
    req,
    sessionData: exchangeCodeResponse,
  });

  res.cookie(config.cookie.keyName, sessionId, {
    maxAge: 60 * 60 * 24 * 30,
  });

  return res.json({
    data: {
      session: { id: sessionId, user },
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

export const signUp = async (req: Request, res: Response) => {
  const { email, password, location, name } = req.body;
  const { data: existingUser } = await userService.getUserByEmail(email);

  if (!isEmpty(existingUser))
    throw new BadRequestError(`User already exists with email: ${email}`);

  const signUpData = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { location, name, full_name: name },
    },
  });

  const { sessionId, user } = await authService.createPlatformUser({
    req,
    sessionData: signUpData,
  });

  res.cookie(config.cookie.keyName, sessionId, {
    maxAge: 60 * 60 * 24 * 30,
  });

  return res.status(200).json({
    data: { session: { id: sessionId, user } },
    success: true,
  });
};

export { login, logOut, session, googleAuth, googleCallback };
