import { getAlphaNumericId } from "@helpers";

export function appendUUIDToFilename(path: string) {
  return path.replace(/(\/[^/]+?)(\.[^.]+)$/, `$1-${getAlphaNumericId(10)}$2`);
}
