import { Platform } from "react-native";

export interface CompressResult {
  uri: string;
  blob?: Blob;
}

export interface CompressOptions {
  mimeType?: string;
}

export async function compressFile(uri: string, options: CompressOptions = {}): Promise<CompressResult> {
  const { mimeType } = options;
  const isImage = mimeType?.startsWith("image");
  const isVideo = mimeType?.startsWith("video");
  if (!isImage && !isVideo) return { uri };

  if (isImage) {
    if (Platform.OS === "web") {
      const { default: imageCompression } = await require("browser-image-compression");
      const blob = await fetch(uri).then((r) => r.blob());
      const compressed = await imageCompression(blob, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      });
      return { uri: URL.createObjectURL(compressed), blob: compressed };
    } else {
      const { Image } = await require("react-native-compressor" as any);
      const compressedUri: string = await Image.compress(uri, { compressionMethod: "auto" });
      return { uri: compressedUri };
    }
  }

  if (isVideo) {
    if (Platform.OS === "web") {
      const blob = await fetch(uri).then((r) => r.blob());
      return { uri, blob };
    }

    const { Video } = await require("react-native-compressor" as any);
    const compressedUri: string = await Video.compress(uri, {
      compressionMethod: "auto"
    });
    return { uri: compressedUri };
  }

  return { uri };
}
