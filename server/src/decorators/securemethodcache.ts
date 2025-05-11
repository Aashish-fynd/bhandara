import { NotFoundError, UnauthorizedError } from "@exceptions";
import { isEmpty } from "@utils";

export type MethodType = "create" | "update" | "delete" | "get";

// Base interface for cache operations
interface CacheOperations<T = any> {
  getCache: (key: string) => Promise<T | T[] | null>;
  setCache: (key: string, value: T | T[]) => Promise<void>;
  deleteCache: (key: string | Record<string, any>) => Promise<void>;
}

// Interface for the class that will use the decorator
export interface CacheableClass<T = any> extends CacheOperations<T> {
  getById: (id: string) => Promise<{ data: T | null; error: any }>;
}

// Options for the decorator
export interface CacheDecoratorOptions<T = any> {
  methodType?: MethodType;
  cacheGetter?: (key: string) => Promise<T | T[] | null>;
  cacheSetter?: (key: string, value: T | T[]) => Promise<"OK">;
  cacheDeleter?: (key: string, existingData: T | T[]) => Promise<any>;
  cacheSetterWithExistingTTL?: (key: string, value: T) => Promise<"OK">;
  customCacheKey?: (...args: any[]) => string;
}

const checkAndThrowRLSError = <T>(
  result: { data: T | null; error: any },
  existingData: T | null
) => {
  if (!result?.error && !result?.data && !isEmpty(existingData)) {
    throw new UnauthorizedError("Operation not allowed");
  }
};

function SecureMethodCache<T = any>(options?: CacheDecoratorOptions<T>) {
  return function <M extends (...args: any[]) => Promise<any>>(
    target: Object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<M>
  ): TypedPropertyDescriptor<M> {
    const originalMethod = descriptor.value!;
    const methodPrefix = propertyKey.match(/^[a-z]+/)?.[0] || "";
    const methodType = options?.methodType || (methodPrefix as MethodType);

    descriptor.value = async function (
      this: CacheableClass<T>,
      ...args: Parameters<M>
    ): Promise<ReturnType<M>> {
      const getCache = options?.cacheGetter || this.getCache;
      const setCache = options?.cacheSetter || this.setCache;
      const deleteCache = options?.cacheDeleter || this.deleteCache;

      const cacheKey = options?.customCacheKey
        ? options.customCacheKey(...args)
        : args[0];

      switch (methodType) {
        case "create": {
          const result = await originalMethod.apply(this, args);

          if (result?.data) {
            const getCacheKey = (id: string) =>
              options?.customCacheKey ? options.customCacheKey(id) : id;

            if (Array.isArray(result.data)) {
              const promises = result.data.map(async (item: any) => {
                await setCache(getCacheKey(item.id), item);
              });
              await Promise.all(promises);
            } else {
              await setCache(getCacheKey(result.data.id), result.data);
            }
          }
          return result;
        }

        case "update": {
          let existingData: T | T[] = await getCache(cacheKey);
          if (isEmpty(existingData)) {
            const res = await this.getById(cacheKey);
            if (isEmpty(res.data))
              throw new NotFoundError("Resource not found");
            existingData = res.data as T;
          }

          const result = await originalMethod.apply(this, args);
          checkAndThrowRLSError(result, existingData);

          const cacheSaver = options?.cacheSetterWithExistingTTL || setCache;

          if (result?.data) {
            if (typeof result.data === "object") {
              await cacheSaver(cacheKey, { ...existingData, ...result.data });
            } else {
              await cacheSaver(cacheKey, result.data);
            }
          }
          return result;
        }

        case "delete": {
          let existingData: T | T[] = await getCache(cacheKey);
          if (isEmpty(existingData)) {
            const res = await this.getById(cacheKey);
            if (isEmpty(res.data))
              throw new NotFoundError("Resource not found");
            existingData = res.data as T;
          }

          const result = await originalMethod.apply(this, args);
          checkAndThrowRLSError(result, existingData);

          if (result?.data) {
            await deleteCache(cacheKey, existingData);
          }
          return result;
        }

        case "get": {
          const cachedData = await getCache(cacheKey);
          if (cachedData)
            return { data: cachedData, error: null } as ReturnType<M>;

          const result = await originalMethod.apply(this, args);
          checkAndThrowRLSError(result, cachedData);

          if (!isEmpty(result?.data)) {
            await setCache(cacheKey, result.data);
          } else {
            throw new NotFoundError("Resource not found");
          }

          return result;
        }

        default:
          return originalMethod.apply(this, args);
      }
    } as M;

    return descriptor;
  };
}

export default SecureMethodCache;
