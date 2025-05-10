import {
  uploadFile,
  getSignedUploadUrl,
  deleteFile,
  getMediaById,
  updateMedia,
  getMediaPublicUrl,
} from "@features/media/controller";
import { asyncHandler, sessionParser, userParser } from "@middlewares";
import { Router } from "express";

const router = Router();

router.use([sessionParser, userParser]);
router.post("/upload", asyncHandler(uploadFile));
router.post("/get-signed-upload-url", asyncHandler(getSignedUploadUrl));
router
  .route("/:mediaId")
  .delete(asyncHandler(deleteFile))
  .get(asyncHandler(getMediaById))
  .patch(asyncHandler(updateMedia));

router.post("/get-public-url", asyncHandler(getMediaPublicUrl));

export default router;
