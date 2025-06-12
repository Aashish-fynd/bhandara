import React, { useState, useRef, useEffect } from "react";
import { CardWrapper } from "../ui/common-styles";
import { XStack, YStack, Text, useIsomorphicLayoutEffect } from "tamagui";
import { Plus, SendHorizontal, X } from "@tamagui/lucide-icons";
import { FilledButton, OutlineButton } from "../ui/Buttons";
import { InputField, TextareaField } from "../Form";
import { NativeSyntheticEvent, TextInputChangeEventData, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { PopoverWrapper } from "../PopoverWrapper";
import AddPopoverContents from "./AddPopoverContents";
import { deleteMedia, IPickerAsset } from "@/common/api/media.action";
import AssetPreview from "./AssetPreview";
import { IMedia } from "@/definitions/types";

interface IProps {
  context: Record<string, any>;
}

export interface IAttachedFile extends IPickerAsset {
  error?: string;
  uploadPercentage?: number;
  retryCallback?: () => void;
  uploadResult?: IMedia;
}

const MessageInputBar = ({ context }: IProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<IAttachedFile[]>([]);
  const textAreaRef = useRef<any>(null);

  const actions = [
    {
      icon: Plus,
      disabled: false,
      handler: () => {
        // Could implement file picker here as an alternative way to attach files
      }
    },
    {
      icon: SendHorizontal,
      disabled: !message && attachedFiles.length === 0,
      handler: () => {
        // Handle sending message with attachedFiles
        setMessage("");
        setAttachedFiles([]);
      }
    }
  ];

  const handleMessageChange = (text: string) => {
    setMessage(text);
  };

  // Web paste handler
  const handleWebPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const fileItems: IAttachedFile[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the pasted item is a file
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          fileItems.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: file
          });
        }
      }
    }

    if (fileItems.length > 0) {
      setAttachedFiles((prev) => [...prev, ...fileItems]);
      // Optional: prevent the default paste behavior for files
      // e.preventDefault();
    }
  };

  // Native clipboard check for files
  const checkNativeClipboard = async () => {
    try {
      // Check if clipboard has an image
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        const imageData = await Clipboard.getImageAsync({ format: "jpeg" });
        if (imageData?.data) {
          // Get filename from URI
          const uriParts = imageData.uri.split("/");
          const name = uriParts[uriParts.length - 1] || "clipboard-image.jpg";

          setAttachedFiles((prev) => [
            ...prev,
            {
              name,
              type: "image/jpeg", // Assume jpeg for simplicity
              size: 0, // Size not available
              data: imageData.base64 || "",
              uri: imageData.uri
            }
          ]);

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking clipboard for images", error);
      return false;
    }
  };

  // Setup paste event listener for web
  useEffect(() => {
    if (Platform.OS === "web") {
      const currentRef = textAreaRef.current;
      if (currentRef) {
        // For web platform
        const handlePaste = (e: ClipboardEvent) => {
          // The implementation will be handled by onPaste prop
        };

        currentRef.addEventListener("paste", handlePaste);
        return () => {
          currentRef.removeEventListener("paste", handlePaste);
        };
      }
    }
  }, []);

  const removeAttachedFile = async (index: number) => {
    await deleteMedia(attachedFiles[index].name);
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  console.log("attachedFiles", attachedFiles);

  return (
    <CardWrapper
      p={"$3"}
      rounded={"$3"}
    >
      {attachedFiles.length > 0 && (
        <XStack
          gap={"$2"}
          flexWrap="wrap"
        >
          {attachedFiles.map((file, index) => (
            <XStack
              key={`${file.name}-${index}`}
              position="relative"
              group
              cursor="pointer"
              height={50}
              width={50}
            >
              <AssetPreview
                type={file.type as "image" | "video"}
                file={file.uri}
              />
              <OutlineButton
                position="absolute"
                t={2}
                r={2}
                icon={<X size={12} />}
                height={18}
                p={"$1"}
                width={18}
                display="none"
                onPress={() => removeAttachedFile(index)}
                $group-hover={{
                  display: "flex"
                }}
              />
            </XStack>
          ))}
        </XStack>
      )}
      <TextareaField
        onChangeText={handleMessageChange}
        value={message}
        onKeyPress={(e) => {
          console.log("e", e.nativeEvent);
        }}
        ref={textAreaRef}
        // For native platforms, check clipboard when focus is gained
        onFocus={Platform.OS !== "web" ? () => checkNativeClipboard() : undefined}
      />
      <XStack
        gap={"$4"}
        justify={"space-between"}
        items={"center"}
      >
        <PopoverWrapper
          trigger={
            <FilledButton
              icon={<Plus size={16} />}
              size={"$2"}
              height={30}
              width={30}
              onPress={() => {}}
              disabled={false}
            />
          }
        >
          <AddPopoverContents
            eventId={context?.eventId || ""}
            setAttachedFiles={setAttachedFiles}
            attachedFiles={attachedFiles}
          />
        </PopoverWrapper>
        <FilledButton
          icon={<SendHorizontal size={16} />}
          size={"$2"}
          height={30}
          width={30}
          disabled={!message}
        />
      </XStack>
    </CardWrapper>
  );
};

export default MessageInputBar;
