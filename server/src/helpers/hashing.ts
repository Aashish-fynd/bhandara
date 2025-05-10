import MD5 from "crypto-js/md5";

export const get32BitMD5Hash = (value: string) => MD5(value).toString();
