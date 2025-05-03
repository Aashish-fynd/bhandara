import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __filename = (url: string) => {
  return fileURLToPath(url);
};
export const __dirname = (url: string) => {
  return path.dirname(fileURLToPath(url));
};

export const getDirectories = (source: string) =>
  readdirSync(__dirname(source), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

export const getRouteFiles = (source: string) =>
  readdirSync(__dirname(source), { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory() && dirent.name.includes("route"))
    .map((dirent) => dirent.name);

export const getDirectoryFiles = (source: string) =>
  readdirSync(__dirname(source), { withFileTypes: true })
    .filter((dirent) => !dirent.isDirectory())
    .map((dirent) => dirent.name);
