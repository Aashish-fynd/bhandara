import { Platform } from "react-native";
import axiosClient from "./base";
import { base64ToBlob, uriToBlob } from "@/utils";
import axios from "axios";

export const getSignedUrlForUpload = async (body: Record<string, any>) => {
  const { file: fileUri, ...rest } = body;
  const response = await axiosClient.post("/media/get-signed-upload-url", rest);
  const { data, error } = response.data;

  const { row, signedUrl } = data;

  const isWebPlatform = Platform.OS === "web";
  let file: Blob | null = null;
  if (isWebPlatform) {
    file = base64ToBlob(body.file);
  } else {
    file = await uriToBlob(body.file);
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
