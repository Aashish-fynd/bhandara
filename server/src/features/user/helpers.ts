import { IBaseUser } from "@definitions/types/global";
import { RedisCache } from "@features/cache";

const userCache = new RedisCache({ namespace: "users" });
const sessionCache = new RedisCache({ namespace: "session" });

export const getUserCache = (userId: string) => {
  return userCache.getItem(userId);
};

export const setUserCache = async (userId: string, user: IBaseUser) => {
  return userCache.setItem(userId, user);
};

export const getUserCacheByEmail = async (email: string) => {
  return userCache.getItem(email);
};

export const setUserCacheByEmail = async (email: string, user: IBaseUser) => {
  return userCache.setItem(email, user);
};

export const getUserSessionCacheList = async (userId: string) => {
  const list = await userCache.getHKeys(`${userId}:sessions`);
};

export const setUserSessionCache = async ({
  userId,
  sessionId,
  data,
  ttl,
}: {
  userId: string;
  sessionId: string;
  data: Record<string, any>;
  ttl: number;
}) => {
  const expiration = new Date(Date.now() + ttl * 1000);
  await userCache.setHKey(
    `${userId}:sessions`,
    sessionId,
    expiration.toISOString()
  );
  return sessionCache.setItem(sessionId, data, ttl);
};

export const getUserSessionCache = async (sessionId: string) => {
  return sessionCache.getItem(sessionId);
};

export const getSafeUser = (user: IBaseUser) => {
  const _user = { ...user };
  delete _user.password;
  delete _user.meta.auth;
  return _user;
};
