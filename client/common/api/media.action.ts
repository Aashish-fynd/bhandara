import { Platform } from "react-native";
import axiosClient from "./base";
import { base64ToBlob, uriToBlob, compressFile } from "@/utils";
import { MEDIA_BUCKET_CONFIG } from "@/constants/media";
import axios from "axios";

export const getSignedUrlForUpload = async (body: Record<string, any>) => {
  const { file: fileUri, mimeType, ...rest } = body;
  const compressed = await compressFile(fileUri, { mimeType });

  const response = await axiosClient.post("/media/get-signed-upload-url", { ...rest, mimeType });
  const { data, error } = response.data;

  const { row, signedUrl } = data;

  const isWebPlatform = Platform.OS === "web";
  let file: Blob | null = null;
  if (isWebPlatform) {
    file = compressed.blob ?? base64ToBlob(compressed.uri);
  } else {
    file = await uriToBlob(compressed.uri);
  }

  const uploadResponse = await axios.put(signedUrl, file, {
    headers: {
      "Content-Type": file.type
    }
  });

  if (uploadResponse.status !== 200) {
    throw new Error("Failed to upload file");
  }

  return row;
};

export interface PickerAsset {
  uri: string;
  mimeType?: string | null;
  fileName: string;
  fileSize: number;
  type?: string;
}

export const uploadPickerAsset = async (
  asset: PickerAsset,
  options: { bucket: string; compressionPercentage: number } & Record<string, any>
) => {
  const { bucket, compressionPercentage, ...rest } = options;
  const config = MEDIA_BUCKET_CONFIG[bucket];
  if (!config) throw new Error("Invalid bucket");

  const { uri, mimeType, fileName, fileSize, type } = asset;

  const compressed = await compressFile(uri, { mimeType: mimeType || undefined, percentage: compressionPercentage });
  const newSize = compressed.size ?? fileSize;

  if (newSize > config.maxSize) {
    throw new Error("File size exceeds bucket limit");
  }

  const response = await axiosClient.post("/media/get-signed-upload-url", {
    path: fileName,
    bucket,
    mimeType,
    size: newSize,
    name: fileName,
    type,
    ...rest,
  });

  const { data } = response.data;
  const { row, signedUrl } = data;

  const isWebPlatform = Platform.OS === "web";
  let file: Blob | null = null;
  if (isWebPlatform) {
    file = compressed.blob ?? base64ToBlob(compressed.uri);
  } else {
    file = await uriToBlob(compressed.uri);
  }

  const uploadResponse = await axios.put(signedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  if (uploadResponse.status !== 200) {
    throw new Error("Failed to upload file");
  }

  return { ...row, size: newSize };
};
