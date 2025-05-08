import { IUserSession } from "@definitions/types";
import { IBaseUser } from "@definitions/types";
import { RedisCache } from "@features/cache";
import { jnparse } from "@utils";

const userCache = new RedisCache({ namespace: "users" });
const sessionCache = new RedisCache({ namespace: "session" });

export const getUserCache = async (userId: string) => {
  return userCache.getItem<IBaseUser>(userId);
};

export const setUserCache = async (
  userId: string,
  user: IBaseUser,
  ttl = 3600
) => {
  return userCache.setItem(userId, user, ttl);
};

export const getUserCacheByEmail = async (email: string) => {
  return userCache.getItem<IBaseUser>(email);
};

export const setUserCacheByEmail = async (
  email: string,
  user: IBaseUser,
  ttl = 3600
) => {
  return userCache.setItem(email, user, ttl);
};

export const getUserSessionCacheList = async (userId: string) => {
  // Step 1: Get all session IDs from the user's hash
  const sessionMap = await userCache.getHKeys(`${userId}:sessions`);

  if (!sessionMap || Object.keys(sessionMap).length === 0) {
    return [];
  }

  const sessionIds = Object.keys(sessionMap);

  // Step 2: Fetch all session objects using pipeline
  const pipeline = sessionCache.getPipeline();
  sessionIds.forEach((sessionId) => {
    pipeline.get(`session:${sessionId}`);
  });

  const results = await pipeline.exec();

  // TODO: TO be used with upstash redis
  // Extract actual session data from results
  // const sessions = results
  //   .map((result: Record<string, any>) => {
  //     return {
  //       device: result.userAgent,
  //       createdAt: result.createdAt,
  //       location: result.location,
  //     };
  //   })
  //   .filter(Boolean);

  // TODO: TO be used with ioredis
  const sessions = results.map(
    ([, result]: [Error, Record<string, any>], index: number) => {
      result = jnparse(result);
      if (!result) return null;
      return {
        id: sessionIds[index],
        device: result.userAgent,
        createdAt: result.createdAt,
        location: result.location,
      };
    }
  );

  return sessions.filter(Boolean);
};

export const setUserSessionCache = async ({
  userId,
  sessionId,
  data,
  ttl = 3600 * 24 * 30,
}: {
  userId: string;
  sessionId: string;
  data: IUserSession;
  ttl?: number;
}) => {
  const expiration = new Date(Date.now() + ttl * 1000);
  await userCache.setHKey(
    `${userId}:sessions`,
    sessionId,
    expiration.toISOString()
  );
  return sessionCache.setItem(sessionId, data, ttl);
};

export const getUserSessionCache = async (
  sessionId: string
): Promise<IUserSession | null> => {
  return sessionCache.getItem(sessionId);
};

export const updateUserSessionCache = async (
  sessionId: string,
  data: IUserSession
) => {
  return sessionCache.updateValue(sessionId, data);
};

export const deleteUserSessionCache = async (
  userId: string,
  sessionId: string
) => {
  return Promise.all([
    sessionCache.deleteItem(sessionId),
    userCache.deleteHKey(`${userId}:sessions`, sessionId),
  ]);
};

export const getSafeUser = (user: IBaseUser) => {
  const _user = { ...user };
  delete _user.password;
  delete _user.meta.auth;
  return _user;
};
