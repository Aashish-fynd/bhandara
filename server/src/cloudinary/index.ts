import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import config from '@/config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: config.cloudinary.secure,
});

class CloudinaryService {
  async uploadFile({
    bucket,
    path,
    base64FileData,
    mimeType,
    options = {},
  }: {
    bucket: string;
    path: string;
    base64FileData: string;
    mimeType: string;
    options?: UploadApiOptions;
  }): Promise<{ data: UploadApiResponse; error: any }> {
    const fileData = `data:${mimeType};base64,${base64FileData}`;
    try {
      const res = await cloudinary.uploader.upload(fileData, {
        folder: bucket,
        public_id: path,
        resource_type: 'auto',
        ...options,
      });
      return { data: res, error: null };
    } catch (error) {
      return { data: null as any, error };
    }
  }

  async deleteFile(publicId: string) {
    try {
      const res = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      return { data: res, error: null };
    } catch (error) {
      return { data: null as any, error };
    }
  }

  getPublicUrl(publicId: string, options: Record<string, any> = {}) {
    const url = cloudinary.url(publicId, { secure: true, ...options });
    return { data: { signedUrl: url }, error: null };
  }

  getSignedUploadParams({ bucket, path }: { bucket: string; path: string }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder: bucket,
      public_id: path,
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      config.cloudinary.apiSecret
    );

    const url = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`;
    return {
      data: {
        url,
        params: {
          ...paramsToSign,
          signature,
          // Cloudinary API key is not a secret and is safe to expose
          // in client side direct upload parameters
          api_key: config.cloudinary.apiKey,
        },
      },
      error: null,
    };
  }
}

export default CloudinaryService;
