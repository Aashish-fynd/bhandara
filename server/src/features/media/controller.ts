import { ICustomRequest } from "@definitions/types";
import { Response } from "express";
import MediaService from "./service";
import { appendUUIDToFilename } from "./utils";
import { NotFoundError } from "@exceptions";
import { isEmpty, pick } from "@utils";

const mediaService = new MediaService();

export const uploadFile = async (req: ICustomRequest, res: Response) => {
  const { file, path, bucket, mimeType, format, ...rest } = req.body;

  const uploadPath = `${req.user.id}/${path}`;
  const uploadRes = (await mediaService.uploadFile({
    file,
    path: appendUUIDToFilename(uploadPath),
    bucket,
    mimeType,
    options: {
      uploader: req.user.id,
      ...rest,
    },
  })) as any;

  return res.status(201).json({ data: uploadRes?.data });
};

export const getSignedUploadUrl = async (
  req: ICustomRequest,
  res: Response
) => {
  const { path, bucket, mimeType, format, ...rest } = req.body;

  const uploadPath = appendUUIDToFilename(`${req.user.id}/${path}`);
  const insertData = {
    path: uploadPath,
    bucket,
    mimeType,
    options: {
      uploader: req.user.id,
      ...rest,
    },
  };

  const { data } = await mediaService.getSignedUrlForUpload(insertData);

  return res.status(200).json({ data });
};

export const createMediaData = async (req: ICustomRequest, res: Response) => {
  const { file, path, bucket, mimeType, format, ...rest } = req.body;

  const uploadPath = `${req.user.id}/${path}`;
  const { data } = await mediaService.create({
    file,
    path: appendUUIDToFilename(uploadPath),
    bucket,
    mimeType,
    options: {
      uploader: req.user.id,
      ...rest,
    },
  });

  return res.status(201).json({ data });
};

export const deleteFile = async (req: ICustomRequest, res: Response) => {
  const { mediaId } = req.params;
  const existingMedia = await mediaService.getById(mediaId);

  if (isEmpty(existingMedia)) throw new NotFoundError("Media not found");
  const { data } = await mediaService.delete(mediaId);

  return res.status(200).json({ data });
};

export const getMediaById = async (req: ICustomRequest, res: Response) => {
  const { mediaId } = req.params;
  const { data } = await mediaService.getById(mediaId);

  if (isEmpty(data)) throw new NotFoundError("Media not found");

  return res.status(200).json({ data });
};

export const getMediaPublicUrl = async (req: ICustomRequest, res: Response) => {
  const { path, bucket } = req.body;
  const signedUrl = await mediaService.getPublicUrl(path, bucket);
  if (isEmpty(signedUrl)) throw new NotFoundError("Media not found at path");

  return res.status(200).json(signedUrl);
};

export const updateMedia = async (req: ICustomRequest, res: Response) => {
  const { mediaId } = req.params;
  const existingMedia = await mediaService.getById(mediaId);

  const updateData = pick(req.body, [
    "caption",
    "access",
    "metadata",
    "thumbnail",
    "name",
  ]);

  if (isEmpty(existingMedia)) throw new NotFoundError("Media not found");

  const { data } = await mediaService.update(mediaId, updateData);

  return res.status(200).json({ data });
};
