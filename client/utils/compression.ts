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
      const { default: imageCompression } = await import("browser-image-compression");
      const blob = await fetch(uri).then((r) => r.blob());
      const compressed = await imageCompression(blob, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      });
      return { uri: URL.createObjectURL(compressed), blob: compressed };
    } else {
      const ImageManipulator = await import("expo-image-manipulator");
      const result = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.7 });
      return { uri: result.uri };
    }
  }

  if (isVideo) {
    const { Video } = await import("react-native-compressor" as any);
    const compressedUri: string = await Video.compress(uri, {
      compressionMethod: "auto"
    });
    if (Platform.OS === "web") {
      const blob = await fetch(compressedUri).then((r) => r.blob());
      return { uri: compressedUri, blob };
    }
    return { uri: compressedUri };
  }

  return { uri };
}
