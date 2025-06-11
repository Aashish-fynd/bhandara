import { Platform } from "react-native";
import axiosClient from "./base";
import { base64ToBlob, uriToBlob, compressFile } from "@/utils";
import axios from "axios";

export const getSignedUrlForUpload = async (body: Record<string, any>) => {
  const { file: fileUri, mimeType, ...rest } = body;
  const response = await axiosClient.post("/media/get-signed-upload-url", rest);
  const { data, error } = response.data;

  const { row, signedUrl } = data;

  const compressed = await compressFile(fileUri, { mimeType });

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
