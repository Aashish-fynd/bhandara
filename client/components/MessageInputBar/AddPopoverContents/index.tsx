import React, { useState } from "react";
import { CircleBgWrapper, PopoverContent } from "../../ui/common-styles";
import { Popover, Text, Theme } from "tamagui";
import { XStack } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";
import * as DocumentPicker from "expo-document-picker";
import { getMediaPublicURLs, uploadPickerAsset } from "@/common/api/media.action";
import { EVENT_MEDIA_BUCKET } from "@/constants/global";
import { useToastController } from "@tamagui/toast";
import { IAttachedFile } from "..";
import { isEmpty } from "@/utils";

interface IProps {
  eventId: string;
  attachedFiles: IAttachedFile[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<IAttachedFile[]>>;
  maxAttachmentLimit?: number;
}

const AddPopoverContents = ({ eventId, setAttachedFiles, attachedFiles, maxAttachmentLimit }: IProps) => {
  const toastController = useToastController();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: any) => {
    const { uri, mimeType = "", name = "", size = 0 } = file;
    const type = mimeType?.split("/")[0] || "";

    // Create a retryCallback function
    const retryCallback = () => {
      // Remove error and reset upload percentage
      setAttachedFiles((prev) =>
        prev.map((f) => {
          if (f.name === name) {
            return { ...f, error: undefined, uploadedRatio: 0 };
          }
          return f;
        })
      );

      // Try uploading again
      uploadFile(file);
    };

    const handleProgress = (progress: number) => {
      setAttachedFiles((prev) =>
        prev.map((f) => {
          if (f.name === name) {
            f.uploadedRatio = progress;
          }
          return f;
        })
      );
    };

    try {
      // Update UI that compression is starting
      setAttachedFiles((prev) =>
        prev.map((f) => {
          if (f.name === name) {
            return { ...f, uploadedRatio: 10, error: undefined };
          }
          return f;
        })
      );

      // Call the upload function with progress tracking
      const result = await uploadPickerAsset(
        {
          name,
          type,
          mimeType,
          uri,
          size: size
        },
        {
          bucket: EVENT_MEDIA_BUCKET,
          compressionPercentage: 70,
          parentPath: eventId,
          onProgress: handleProgress
        }
      );

      // Update with 100% when complete
      setAttachedFiles((prev) =>
        prev.map((f) => {
          if (f.name === name) {
            return { ...f, uploadedRatio: 100, uploadResult: result };
          }
          return f;
        })
      );

      return result;
    } catch (error: any) {
      console.error("error", error);
      // Update the file with error state and add retry callback
      setAttachedFiles((prev) =>
        prev.map((f) => {
          if (f.name === name) {
            return { ...f, error: error?.message || "Upload failed", retryCallback };
          }
          return f;
        })
      );

      throw error; // Re-throw to be caught by the main handler
    }
  };

  const handleFilePick = async () => {
    const file = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "video/*"],
      multiple: true
    });

    if (file && !file.canceled) {
      try {
        setIsUploading(true);
        const promises = [];

        if (maxAttachmentLimit) {
          const currentSelectedFiles = file.assets.length;
          const currentAssetsCount = +attachedFiles.filter((f) => !f.error).length;
          file.assets = file.assets.slice(0, Math.max(currentSelectedFiles, maxAttachmentLimit) - currentAssetsCount);
          if (currentSelectedFiles + currentAssetsCount > maxAttachmentLimit) {
            toastController.show(
              `You can only upload ${maxAttachmentLimit} ${maxAttachmentLimit === 1 ? "file" : "files"} at a time`
            );
          }
        }

        for (const _file of file.assets) {
          const { name = "", size } = _file;

          // if file is already there skip it
          if (!size || attachedFiles.find((f) => f.name === name)) continue;

          // Add file to state first
          setAttachedFiles((prev) => [
            ...prev,
            {
              ..._file,
              name,
              type: _file.mimeType?.split("/")[0] || "",
              mimeType: _file.mimeType || "",
              uri: _file.uri,
              size: size || 0,
              uploadedRatio: 0
            }
          ]);

          // Process files in parallel but handle errors individually
          promises.push(
            uploadFile(_file).catch((error) => {
              // Individual file errors are already handled in uploadFile function
              // Just return null to continue with other uploads
              return null;
            })
          );
        }

        // Wait for all uploads to complete
        const results = await Promise.allSettled(promises);
        const successCountFiles = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        const successCount = successCountFiles.length;
        if (successCount > 0) {
          toastController.show(`Uploaded ${successCount} ${successCount === 1 ? "file" : "files"} successfully`);
        }

        // If some files failed
        const failedCount = promises.length - successCount;
        if (failedCount > 0) {
          toastController.show(
            `${failedCount} ${failedCount === 1 ? "file" : "files"} failed to upload. You can retry uploading them.`
          );
        }

        const publicIdsFetch = successCountFiles.map((result) => result?.id);
        getMediaPublicURLs(publicIdsFetch)
          .then((res) => {
            const publicURLs = res.data;
            if (isEmpty(publicURLs)) return;

            setAttachedFiles((prev) => {
              prev.map((f) => {
                if (f.uploadResult?.id) {
                  const publicURL = publicURLs?.[f.uploadResult.id]?.publicUrl;
                  if (publicURL) {
                    f.publicURL = publicURL;
                    delete f.uri;
                    delete (f as any).file;
                  }
                }
              });
              return prev;
            });
          })
          .catch((error) => {
            console.error("error", error);
            toastController.show(error?.message || "Something went wrong");
          });
      } catch (error: any) {
        toastController.show(error?.message || "Something went wrong");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <PopoverContent
      mr="$4"
      z={10000}
      p={"$2"}
    >
      <Theme name={"dark"}>
        <Popover.Close asChild>
          <XStack
            gap={"$2"}
            items={"center"}
            cursor={"pointer"}
            onPress={handleFilePick}
            px={"$2"}
            py={"$1"}
            hoverStyle={{ bg: "$color3", rounded: "$2" }}
            opacity={isUploading ? 0.6 : 1} // Visual feedback when uploading
            disabled={isUploading}
          >
            <CircleBgWrapper
              bg={"$color4"}
              height={24}
              width={24}
            >
              <Plus
                size={16}
                color={"$color12"}
              />
            </CircleBgWrapper>
            <Text
              fontSize={"$3"}
              color={"$color12"}
            >
              Upload files
            </Text>
          </XStack>
        </Popover.Close>
      </Theme>
    </PopoverContent>
  );
};

export default AddPopoverContents;
