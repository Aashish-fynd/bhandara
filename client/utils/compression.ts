import { Platform } from "react-native";

/**
 * Compress a video blob in the browser to roughly the target size.
 */
async function compressVideoWeb(blob: Blob, targetSize: number): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  await new Promise((res) => video.addEventListener("loadedmetadata", res, { once: true }));
  const bitsPerSecond = video.duration ? (targetSize * 8) / video.duration : undefined;
  const stream = (video as any).captureStream();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm", videoBitsPerSecond: bitsPerSecond });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });
  recorder.start();
  video.play();
  await new Promise((res) => video.addEventListener("ended", res, { once: true }));
  recorder.stop();
  const result = await stopPromise;
  URL.revokeObjectURL(url);
  return result;
}

export interface CompressResult {
  uri: string;
  blob?: Blob;
  size?: number;
}

export interface CompressOptions {
  mimeType?: string;
  /** Desired size percentage of the original file */
  percentage?: number;
}

/**
 * Compress an image or video file according to the provided options.
 */
export async function compressFile(
  uri: string,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const { mimeType, percentage = 100 } = options;
  const isImage = mimeType?.startsWith("image");
  const isVideo = mimeType?.startsWith("video");
  if (!isImage && !isVideo) {
    const blob = Platform.OS === "web" ? await fetch(uri).then((r) => r.blob()) : undefined;
    return { uri, blob, size: blob?.size };
  }

  if (isImage) {
    if (Platform.OS === "web") {
      const { default: imageCompression } = await require("browser-image-compression");
      const blob = await fetch(uri).then((r) => r.blob());
      const maxSizeMB = (blob.size / 1024 / 1024) * (percentage / 100);
      const compressed = await imageCompression(blob, {
        maxSizeMB,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      });
      return { uri: URL.createObjectURL(compressed), blob: compressed, size: compressed.size };
    } else {
      const { Image } = await require("react-native-compressor" as any);
      const compressedUri: string = await Image.compress(uri, {
        compressionMethod: "auto",
        quality: percentage
      });
      try {
        const b = await fetch(compressedUri).then((r) => r.blob());
        return { uri: compressedUri, size: b.size };
      } catch {
        return { uri: compressedUri };
      }
    }
  }

  if (isVideo) {
    if (Platform.OS === "web") {
      const blob = await fetch(uri).then((r) => r.blob());
      const target = blob.size * (percentage / 100);
      const compressed = await compressVideoWeb(blob, target);
      return { uri: URL.createObjectURL(compressed), blob: compressed, size: compressed.size };
    }

    const { Video } = await require("react-native-compressor" as any);
    const compressedUri: string = await Video.compress(uri, {
      compressionMethod: "auto",
      quality: percentage
    });
    try {
      const b = await fetch(compressedUri).then((r) => r.blob());
      return { uri: compressedUri, size: b.size };
    } catch {
      return { uri: compressedUri };
    }
  }

  return { uri };
}
