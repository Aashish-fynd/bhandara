export {};

let worker: Worker | null = null;
let idCounter = 0;
const pending: Record<number, (value: any) => void> = {};

export function ensureWorker() {
  if (!worker) {
    const workerBlob = new Blob(
      [
        `
      importScripts('https://unpkg.com/browser-image-compression@2.0.2/dist/browser-image-compression.js');
      
      self.onmessage = async (e) => {
        const { id, action, payload } = e.data;
        try {
          let result;
          switch (action) {
            case 'compressImage': {
              const { uri, width, percentage } = payload;
              const blob = await fetch(uri).then(r => r.blob());
              const maxSizeMB = (blob.size / 1024 / 1024) * ((percentage ?? 100) / 100);
              const compressed = await imageCompression(blob, {
                maxSizeMB,
                maxWidthOrHeight: width || 1280,
                useWebWorker: true,
              });
              result = {
                uri: URL.createObjectURL(compressed),
                blob: compressed,
                size: compressed.size,
              };
              break;
            }
            case 'imageVariants': {
              const { uri, mimeType } = payload;
              const blob = await fetch(uri).then(r => r.blob());
              const compress = async (width) => {
                const compressed = await imageCompression(blob, {
                  maxWidthOrHeight: width,
                  useWebWorker: true,
                });
                return { uri: URL.createObjectURL(compressed), blob: compressed, size: compressed.size };
              };
              const [low, high] = await Promise.all([compress(200), compress(400)]);
              result = [{ ...low, suffix: "@1x" },{ ...high, suffix: "@2x" }];
              break;
            }
            default:
              result = null;
          }
          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({ id, error: error.message });
        }
      };
    `
      ],
      { type: "application/javascript" }
    );

    worker = new Worker(URL.createObjectURL(workerBlob));
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const resolver = pending[id];
      if (resolver) {
        delete pending[id];
        resolver({ result, error });
      }
    };
  }
  return worker;
}

export function runWorker<T>(action: string, payload: any): Promise<T> {
  if (typeof Worker === "undefined") {
    return Promise.reject(new Error("Worker not supported"));
  }
  ensureWorker();
  return new Promise((resolve, reject) => {
    const id = ++idCounter;
    pending[id] = ({ result, error }) => {
      if (error) reject(new Error(error));
      else resolve(result);
    };
    worker!.postMessage({ id, action, payload });
  });
}
