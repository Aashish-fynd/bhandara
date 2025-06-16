import {
  uploadFile,
  getSignedUploadUrl,
  deleteFile,
  getMediaById,
  updateMedia,
  getMediaPublicUrl,
  getMediaPublicUrls,
} from "@features/media/controller";
import { asyncHandler, sessionParser, userParser } from "@middlewares";
import { Router } from "express";

const router = Router({ mergeParams: true });

router.use([sessionParser, userParser]);

router.get("/public-urls", asyncHandler(getMediaPublicUrls));
router.post("/upload", asyncHandler(uploadFile));
router.post("/get-signed-upload-url", asyncHandler(getSignedUploadUrl));
router
  .route("/:mediaId")
  .delete(asyncHandler(deleteFile))
  .get(asyncHandler(getMediaById))
  .patch(asyncHandler(updateMedia));

router.post("/public-url", asyncHandler(getMediaPublicUrl));

export default router;
