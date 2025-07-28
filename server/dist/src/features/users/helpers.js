import { RedisCache } from "@features/cache";
import { jnparse, jnstringify } from "@utils";
import { CACHE_NAMESPACE_CONFIG } from "@constants";
const userCacheNamespace = CACHE_NAMESPACE_CONFIG.Users.namespace;
const userCacheTTL = CACHE_NAMESPACE_CONFIG.Users.ttl;
const sessionCacheNamespace = CACHE_NAMESPACE_CONFIG.Sessions.namespace;
const userCache = new RedisCache({
    namespace: userCacheNamespace,
    defaultTTLSeconds: userCacheTTL,
});
const sessionCache = new RedisCache({
    namespace: sessionCacheNamespace,
    defaultTTLSeconds: CACHE_NAMESPACE_CONFIG.Sessions.ttl,
});
export const getUserCache = async (userId) => {
    return userCache.getItem(userId);
};
export const setUserCache = async (userId, user, ttl = userCacheTTL) => {
    return userCache.setItem(userId, user, ttl);
};
export const deleteUserCache = async (userId) => {
    return userCache.deleteItem(userId);
};
export const deleteAllUserCache = async (userId, user) => {
    const sessionMap = await userCache.getHKeys(`${userId}:sessions`);
    const sessionIds = Object.keys(sessionMap);
    const pipeline = userCache.getPipeline();
    pipeline.del(`${userCacheNamespace}:${userId}`);
    pipeline.del(`${userCacheNamespace}:${userId}:sessions`);
    pipeline.del(`${userCacheNamespace}:${userId}:interests`);
    if (user?.email)
        pipeline.del(`${userCacheNamespace}:${user.email}`);
    if (user?.username)
        pipeline.del(`${userCacheNamespace}:${user.username}`);
    sessionIds.forEach((sessionId) => {
        pipeline.del(`${sessionCacheNamespace}:${sessionId}`);
    });
    return pipeline.exec();
};
export const getUserCacheByEmail = async (email) => {
    const id = await userCache.getItem(email);
    if (!id)
        return null;
    return userCache.getItem(id);
};
export const setUserCacheByEmail = async (email, user, ttl = userCacheTTL) => {
    return userCache.setItem(email, user.id, ttl);
};
export const getUserCacheByUsername = async (username) => {
    const id = await userCache.getItem(username);
    if (!id)
        return null;
    return userCache.getItem(id);
};
export const setUserCacheByUsername = async (username, user, ttl = userCacheTTL) => {
    return userCache.setItem(username, user.id, ttl);
};
export const getUserSessionCacheList = async (userId) => {
    // Step 1: Get all session IDs from the user's hash
    const sessionMap = await userCache.getHKeys(`${userId}:sessions`);
    if (!sessionMap || Object.keys(sessionMap).length === 0) {
        return [];
    }
    const sessionIds = Object.keys(sessionMap);
    // Step 2: Fetch all session objects using pipeline
    const pipeline = sessionCache.getPipeline();
    sessionIds.forEach((sessionId) => {
        pipeline.get(`${sessionCacheNamespace}:${sessionId}`);
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
    const sessions = results.map(([, result], index) => {
        result = jnparse(result);
        if (!result)
            return null;
        return {
            id: sessionIds[index],
            device: result.userAgent,
            createdAt: result.createdAt,
            location: result.location,
        };
    });
    return sessions.filter(Boolean);
};
export const setUserSessionCache = async ({ userId, sessionId, data, ttl = 3600 * 24 * 30, }) => {
    const expiration = new Date(Date.now() + ttl * 1000);
    await userCache.setHKey(`${userId}:sessions`, sessionId, expiration.toISOString());
    return sessionCache.setItem(sessionId, data, ttl);
};
export const getUserSessionCache = async (sessionId) => {
    return sessionCache.getItem(sessionId);
};
export const updateUserSessionCache = async (sessionId, data) => {
    return sessionCache.updateValue(sessionId, data);
};
export const deleteUserSessionCache = async (userId, sessionId) => {
    return Promise.all([
        sessionCache.deleteItem(sessionId),
        userCache.deleteHKey(`${userId}:sessions`, sessionId),
    ]);
};
export const getSafeUser = (user) => {
    const _user = { ...user };
    delete _user.password;
    delete _user.meta.auth;
    return _user;
};
export const getLeanUser = (user) => {
    const safe = getSafeUser(user);
    const { id, name, createdAt, deletedAt, username, email } = safe;
    return { id, name, createdAt, deletedAt, username, email };
};
export const getUserInterestsCache = (userId) => {
    return userCache.getItem(`${userId}:interests`);
};
export const setUserInterestsCache = (userId, interests) => {
    return userCache.setItem(`${userId}:interests`, interests);
};
export const deleteUserInterestsCache = (userId) => {
    return userCache.deleteItem(`${userId}:interests`);
};
export const bulkSetUserCache = async (users) => {
    const pipeline = userCache.getPipeline();
    users.forEach((user) => {
        pipeline.set(`${userCacheNamespace}:${user.id}`, jnstringify(user));
        pipeline.set(`${userCacheNamespace}:${user.email}`, user.id);
        pipeline.expire(`${userCacheNamespace}:${user.email}`, userCacheTTL);
        pipeline.set(`${userCacheNamespace}:${user.username}`, user.id);
        pipeline.expire(`${userCacheNamespace}:${user.username}`, userCacheTTL);
        pipeline.expire(`${userCacheNamespace}:${user.id}`, userCacheTTL);
    });
    await pipeline.exec();
    return "OK";
};
export const bulkGetUserCache = async (ids) => {
    const pipeline = userCache.getPipeline();
    ids.forEach((id) => {
        pipeline.get(`${userCacheNamespace}:${id}`);
    });
    const results = await pipeline.exec();
    const users = results.reduce((acc, [_, result]) => {
        const user = jnparse(result);
        if (!user)
            return acc;
        acc.push(user);
        return acc;
    }, []);
    return users;
};
//# sourceMappingURL=helpers.js.map