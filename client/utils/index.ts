import { Buffer } from "buffer";

export const jnstringify = (payload: any) => JSON.stringify(payload);
export const jnparse = (payload: any) => JSON.parse(payload);

export const pick = <T extends Record<string, any>, K extends string>(
  obj: T | null | undefined,
  keys: K[]
): Partial<Record<string, any>> => {
  if (!obj) return {};

  const result: Record<string, any> = {};

  for (const key of keys) {
    const parts = key.split(".");
    let source: any = obj;
    let validPath = true;

    for (const part of parts) {
      if (source && typeof source === "object" && part in source) {
        source = source[part];
      } else {
        validPath = false;
        break;
      }
    }

    if (validPath) {
      const lastKey = parts[parts.length - 1];
      result[lastKey] = source;
    }
  }

  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]) => {
  const newObj = { ...obj };
  keys.forEach((key) => {
    delete newObj[key];
  });
  return newObj;
};

export const isEmpty = (value: any) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export const startCase = (str: string) => {
  if (!str) return "";

  return str
    .replace(/[_-]/g, " ") // Replace hyphens and underscores with spaces
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, " "); // Replace multiple spaces with single space
};

export const kebabCase = (str: string) => {
  if (str === null || str === undefined) return "";
  if (typeof str !== "string") return "";

  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Add hyphen between camelCase
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/[^a-zA-Z0-9-]/g, "") // Remove special characters
    .toLowerCase() // Convert to lowercase
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

export const isEqual = (value: any, other: any): boolean => {
  // Handle strict equality and NaN
  if (value === other) return true;
  if (Number.isNaN(value) && Number.isNaN(other)) return true;

  // If either is null or not an object, return false
  if (value == null || other == null) return false;
  if (typeof value !== "object" || typeof other !== "object") return false;

  // Handle arrays
  const isArrayA = Array.isArray(value);
  const isArrayB = Array.isArray(other);
  if (isArrayA !== isArrayB) return false;
  if (isArrayA && isArrayB) {
    if (value.length !== other.length) return false;
    return value.every((item, index) => isEqual(item, other[index]));
  }

  // Handle Dates
  if (value instanceof Date && other instanceof Date) {
    return value.getTime() === other.getTime();
  }

  // Handle RegExps
  if (value instanceof RegExp && other instanceof RegExp) {
    return value.toString() === other.toString();
  }

  // Handle objects
  const valueKeys = Object.keys(value);
  const otherKeys = Object.keys(other);
  if (valueKeys.length !== otherKeys.length) return false;

  return valueKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(other, key)) return false;
    return isEqual(value[key], other[key]);
  });
};

export const isBase64DataUri = (uri: string): boolean => {
  return /^data:[a-zA-Z]+\/[a-zA-Z0-9\-\+\.]+;base64,/.test(uri);
};

export const isFileUri = (uri: string): boolean => {
  return uri.startsWith("file://");
};

export const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return await response.blob();
};

export const base64ToBlob = (base64DataUri: string): Blob => {
  const [header, base64] = base64DataUri.split(",");
  const contentType = header.match(/data:(.*);base64/)?.[1] || "application/octet-stream";

  const byteArray = Buffer.from(base64, "base64"); // No deprecated atob
  return new Blob([byteArray], { type: contentType });
};

export const formTruthyValues = (data: Record<string, any>) => {
  return Object.fromEntries(Object.entries(data).filter(([_, value]) => Boolean(value)));
};

export * from "./compression";
export * from "./share.utils";
