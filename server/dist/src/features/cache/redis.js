import { redis } from "@/connections";
// import { Redis } from "@upstash/redis"; // TODO: Uncomment on prod
import { jnparse, jnstringify } from "@utils";
class RedisCache {
    redisClient;
    cacheNamespace;
    defaultTTLSeconds;
    constructor(config) {
        this.redisClient = redis;
        this.cacheNamespace = config.namespace;
        this.defaultTTLSeconds = config.defaultTTLSeconds || 3600;
    }
    /**
     * Decorator to add caching to methods
     * @param {Object} methodOptions - Options for the cache
     * @param {number} [methodOptions.timeToLiveSeconds] - Time to live in seconds
     * @param {Function} [methodOptions.customKeyGenerator] - Custom key generator function
     * @returns {Function} Decorated method
     *
     * @example
     *
     * class MyService {
     *   @RedisCache.withCache()
     *   async myMethod(arg1: string, arg2: number) {
     *     return this.myMethod(arg1, arg2);
     *   }
     * }
     *
     */
    withCache(methodOptions = {}) {
        // Capture redis instance variables in closure
        const redisClient = this.redisClient;
        const cacheNamespace = this.cacheNamespace;
        const defaultTTL = this.defaultTTLSeconds;
        return function (target, methodName, descriptor) {
            const originalMethod = descriptor.value;
            const _options = {
                timeToLiveSeconds: defaultTTL,
                skipCacheGet: false,
                skipCacheSet: false,
                ...methodOptions,
            };
            descriptor.value = async function (...methodArgs) {
                // Build cache key
                const keyPart = methodOptions.customKeyGenerator
                    ? methodOptions.customKeyGenerator(methodArgs)
                    : `${methodName}:${JSON.stringify(methodArgs)}`;
                const cacheKey = `${cacheNamespace}:${keyPart}`;
                try {
                    // Try cache first if not skipped
                    if (!methodOptions.skipCacheGet) {
                        const cachedResult = (await redisClient.get(cacheKey));
                        if (cachedResult)
                            return JSON.parse(cachedResult);
                    }
                    // If not in cache, call original method
                    // 'this' here correctly refers to the service instance
                    const databaseResult = await originalMethod.apply(this, methodArgs);
                    // Cache the result if successful
                    if (!methodOptions.skipCacheSet &&
                        databaseResult &&
                        !databaseResult.error)
                        await redisClient.setex(cacheKey, _options.timeToLiveSeconds, JSON.stringify(databaseResult));
                    return databaseResult;
                }
                catch (error) {
                    // Fallback to original method if cache fails
                    return originalMethod.apply(this, methodArgs);
                }
            };
            return descriptor;
        };
    }
    async invalidateCache(pattern) {
        try {
            const fullPattern = `${this.cacheNamespace}:${pattern}`;
            const matchingKeys = await this.redisClient.keys(fullPattern);
            if (matchingKeys.length > 0) {
                await this.redisClient.del(...matchingKeys);
            }
        }
        catch (error) {
            console.error("Redis cache invalidation failed:", error);
        }
    }
    setItem(key, value, ttl) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        // return this.redisClient.set(namespacedKey, jnstringify(value), {
        //   ex: ttl || this.defaultTTLSeconds,
        // }); // TODO: Uncomment on prod
        return this.redisClient.set(namespacedKey, jnstringify(value), "EX", ttl || this.defaultTTLSeconds);
    }
    async getItem(key) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        const result = await this.redisClient.get(namespacedKey);
        return result ? jnparse(result) : null;
    }
    setHKey(key, field, value, ttl) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        const pipeLine = this.redisClient.pipeline();
        pipeLine.hset(namespacedKey, { [field]: jnstringify(value) });
        if (ttl)
            pipeLine.expire(namespacedKey, ttl);
        return pipeLine.exec();
    }
    getHKey(key, field) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.hget(namespacedKey, field);
    }
    getHKeys(key) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.hgetall(namespacedKey);
    }
    setList(key, value, ttl) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.lpush(namespacedKey, jnstringify(value));
    }
    getList(key) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.lrange(namespacedKey, 0, -1);
    }
    deleteItem(key) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.del(namespacedKey);
    }
    deleteHKey(key, field) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.hdel(namespacedKey, field);
    }
    getPipeline() {
        return this.redisClient.pipeline();
    }
    /**
     * Wraps an async function with caching logic.
     * @param fn The async function to wrap.
     * @param options Cache options.
     * @returns A new function with the same signature as fn, but with caching.
     */
    cacheWrapper(fn, options = {}) {
        // const redisClient = this.redisClient;
        // const cacheNamespace = this.cacheNamespace;
        // const defaultTTL = this.defaultTTLSeconds;
        return async function (...args) {
            const keyPart = options.customKeyGenerator
                ? options.customKeyGenerator(args)
                : `${fn.name}:${JSON.stringify(args)}`;
            const cacheKey = `${this.cacheNamespace}:${keyPart}`;
            const ttl = options.timeToLiveSeconds || this.defaultTTLSeconds;
            try {
                if (!options.skipCacheGet) {
                    const cachedResult = await this.getItem(cacheKey);
                    if (cachedResult)
                        return cachedResult;
                }
                const result = await fn(...args);
                if (!options.skipCacheSet && result && !result.error) {
                    await this.setItem(cacheKey, result, ttl);
                }
                return result;
            }
            catch (error) {
                return fn(...args);
            }
        };
    }
    updateValue(key, newValue) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return redis.set(namespacedKey, jnstringify(newValue), "KEEPTTL");
    }
    getTTL(key) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.ttl(namespacedKey);
    }
    setTTL(key, ttl) {
        const namespacedKey = `${this.cacheNamespace}:${key}`;
        return this.redisClient.expire(namespacedKey, ttl);
    }
    get defaultTTLMs() {
        return this.defaultTTLSeconds;
    }
    get namespace() {
        return this.cacheNamespace;
    }
}
export default RedisCache;
//# sourceMappingURL=redis.js.map