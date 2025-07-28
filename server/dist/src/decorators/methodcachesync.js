import { NotFoundError, UnauthorizedError } from "@exceptions";
import { isEmpty } from "@utils";
const extractData = (result) => {
    if (result && typeof result === "object" && "data" in result) {
        return result.data;
    }
    return (result ?? null);
};
const extractError = (result) => {
    if (result && typeof result === "object" && "error" in result) {
        return result.error;
    }
    return null;
};
const checkAndThrowRLSError = (result, existingData) => {
    const data = extractData(result);
    const error = extractError(result);
    if (!error && !data && !isEmpty(existingData)) {
        throw new UnauthorizedError("Operation not allowed");
    }
};
/**
 * A decorator that adds caching functionality to class methods
 * @template T The type of data being cached
 * @param {CacheDecoratorOptions<T>} [options] Optional configuration for the cache decorator
 * @returns {Function} A method decorator that adds caching behavior
 *
 * @example
 * ```typescript
 * class UserService {
 *   @MethodCacheSync<User>()
 *   async getById(id: string) {
 *     // Method implementation
 *   }
 * }
 * ```
 */
function MethodCacheSync(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const methodPrefix = propertyKey.match(/^[a-z]+/)?.[0] || "";
        const methodType = options?.methodType || methodPrefix;
        /**
         * The wrapped method that implements caching logic
         * @this {CacheableClass<T>} The class instance with cache operations
         * @param {...Parameters<M>} args The arguments passed to the original method
         * @returns {Promise<ReturnType<M>>} The result of the method execution
         */
        descriptor.value = async function (...args) {
            // Bind the methods to the current instance
            const boundGetCache = (options?.cacheGetter || this.getCache).bind(this);
            const boundSetCache = (options?.cacheSetter || this.setCache).bind(this);
            const boundDeleteCache = (options?.cacheDeleter || this.deleteCache).bind(this);
            const boundGetById = (this?._getByIdNoCache || this.getById).bind(this);
            const cacheKey = options?.customCacheKey
                ? options.customCacheKey(...args)
                : args[0];
            switch (methodType) {
                case "create": {
                    const result = await originalMethod.apply(this, args);
                    const data = extractData(result);
                    if (data) {
                        const getCacheKey = (id) => options?.customCacheKey ? options.customCacheKey(id) : id;
                        if (Array.isArray(data)) {
                            const promises = data.map(async (item) => {
                                await boundSetCache(getCacheKey(item.id), item);
                            });
                            await Promise.all(promises);
                        }
                        else if (typeof data === "object") {
                            await boundSetCache(getCacheKey(data.id), data);
                        }
                    }
                    return result;
                }
                case "update": {
                    const existingData = await boundGetById(cacheKey);
                    if (isEmpty(existingData))
                        throw new NotFoundError("Resource not found");
                    const result = await originalMethod.apply(this, args);
                    checkAndThrowRLSError(result, existingData);
                    const cacheSaver = options?.cacheSetterWithExistingTTL || boundSetCache;
                    const data = extractData(result);
                    if (data) {
                        if (typeof data === "object") {
                            await cacheSaver(cacheKey, { ...existingData, ...data });
                        }
                        else {
                            await cacheSaver(cacheKey, data);
                        }
                    }
                    return result;
                }
                case "delete": {
                    const existingData = await boundGetById(cacheKey);
                    if (isEmpty(existingData))
                        throw new NotFoundError("Resource not found");
                    const result = await originalMethod.apply(this, args);
                    checkAndThrowRLSError(result, existingData);
                    const data = extractData(result);
                    if (data)
                        await boundDeleteCache(cacheKey, existingData);
                    return result;
                }
                case "get": {
                    const cachedData = await boundGetCache(cacheKey);
                    if (!isEmpty(cachedData))
                        return cachedData;
                    const result = await originalMethod.apply(this, args);
                    checkAndThrowRLSError(result, cachedData);
                    const data = extractData(result);
                    if (!isEmpty(data))
                        await boundSetCache(cacheKey, data);
                    return result;
                }
                default:
                    return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}
export default MethodCacheSync;
//# sourceMappingURL=methodcachesync.js.map