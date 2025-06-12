import React from "react";
import { CircleBgWrapper, PopoverContent } from "../ui/common-styles";
import { Popover, Text, Theme } from "tamagui";
import { XStack } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";
import * as DocumentPicker from "expo-document-picker";
import { getSignedUrlForUpload } from "@/common/api/media.action";
import { AVATAR_BUCKET, EVENT_MEDIA_BUCKET } from "@/constants/global";
import { useToastController } from "@tamagui/toast";

const AddPopoverContents = () => {
  const toastController = useToastController();

  const handleFilePick = async () => {
    const file = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "video/*"]
    });
    if (file && !file.canceled) {
      try {
        const { uri, mimeType, name, size } = file.assets[0];
        const [fileType, fileExtension] = mimeType!.split("/");

        let parsedName = name;
        if (fileExtension) parsedName = name.replace(`.${fileExtension}`, "");

        const uploadedMediaData = await getSignedUrlForUpload({
          name: parsedName,
          path: name,
          type: fileType,
          mimeType,
          bucket: EVENT_MEDIA_BUCKET,
          size,
          file: uri
        });

        console.log("mediaRow", uploadedMediaData);
      } catch (error: any) {
        toastController.show(error?.message || "Something went wrong");
      }
    }
  };
  return (
    <PopoverContent
      mr="$4"
      z={10000}
      p={"$2"}
    >
      <Popover.Close asChild>
        <Theme name={"dark"}>
          <XStack
            gap={"$2"}
            items={"center"}
            cursor={"pointer"}
            onPress={handleFilePick}
            px={"$2"}
            py={"$1"}
            hoverStyle={{ bg: "$color3", rounded: "$2" }}
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
        </Theme>
      </Popover.Close>
    </PopoverContent>
  );
};

export default AddPopoverContents;
