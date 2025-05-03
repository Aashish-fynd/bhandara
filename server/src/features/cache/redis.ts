import { redis } from "@/connections";
import { Redis } from "@upstash/redis";
import { jnparse, jnstringify } from "@utils";

interface RedisCacheConfig {
  redisClient?: Redis;
  namespace: string;
  defaultTTLSeconds?: number;
}

interface MethodCacheOptions {
  timeToLiveSeconds?: number;
  customKeyGenerator?: (methodArgs: any[]) => string;
  skipCacheGet?: boolean;
  skipCacheSet?: boolean;
}

class RedisCache {
  private readonly redisClient: Redis;
  private readonly cacheNamespace: string;
  private readonly defaultTTLSeconds: number;

  constructor(config: RedisCacheConfig) {
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
  withCache(methodOptions: MethodCacheOptions = {}): Function {
    // Capture redis instance variables in closure
    const redisClient = this.redisClient;
    const cacheNamespace = this.cacheNamespace;
    const defaultTTL = this.defaultTTLSeconds;

    return function (
      target: any,
      methodName: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      const _options: MethodCacheOptions = {
        timeToLiveSeconds: defaultTTL,
        skipCacheGet: false,
        skipCacheSet: false,
        ...methodOptions,
      };

      descriptor.value = async function (...methodArgs: any[]) {
        // Build cache key
        const keyPart = methodOptions.customKeyGenerator
          ? methodOptions.customKeyGenerator(methodArgs)
          : `${methodName}:${JSON.stringify(methodArgs)}`;
        const cacheKey = `${cacheNamespace}:${keyPart}`;

        try {
          // Try cache first if not skipped
          if (!methodOptions.skipCacheGet) {
            const cachedResult = (await redisClient.get(cacheKey)) as string;
            if (cachedResult) return JSON.parse(cachedResult);
          }

          // If not in cache, call original method
          // 'this' here correctly refers to the service instance
          const databaseResult = await originalMethod.apply(this, methodArgs);

          // Cache the result if successful
          if (
            !methodOptions.skipCacheSet &&
            databaseResult &&
            !databaseResult.error
          )
            await redisClient.setex(
              cacheKey,
              _options.timeToLiveSeconds!,
              JSON.stringify(databaseResult)
            );

          return databaseResult;
        } catch (error) {
          // Fallback to original method if cache fails
          return originalMethod.apply(this, methodArgs);
        }
      };

      return descriptor;
    };
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const fullPattern = `${this.cacheNamespace}:${pattern}`;
      const matchingKeys = await this.redisClient.keys(fullPattern);
      if (matchingKeys.length > 0) {
        await this.redisClient.del(...matchingKeys);
      }
    } catch (error) {
      console.error("Redis cache invalidation failed:", error);
    }
  }

  setItem(key: string, value: any, ttl?: number) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    return this.redisClient.set(namespacedKey, jnstringify(value), {
      ex: ttl || this.defaultTTLSeconds,
    });
  }

  async getItem(key: string) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    const res = await this.redisClient.get(namespacedKey);
    if (res) return jnparse(res);
    return null;
  }

  setHKey(key: string, field: string, value: any, ttl?: number) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    const pipeLine = this.redisClient.pipeline();
    pipeLine.hset(namespacedKey, { [field]: jnstringify(value) });
    if (ttl) pipeLine.expire(namespacedKey, ttl);
    return pipeLine.exec();
  }

  getHKey(key: string, field: string) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    return this.redisClient.hget(namespacedKey, field);
  }

  getHKeys(key: string) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    return this.redisClient.hgetall(namespacedKey);
  }

  setList(key: string, value: any, ttl?: number) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    return this.redisClient.lpush(namespacedKey, jnstringify(value));
  }

  getList(key: string) {
    const namespacedKey = `${this.cacheNamespace}:${key}`;
    return this.redisClient.lrange(namespacedKey, 0, -1);
  }
}

export default RedisCache;
