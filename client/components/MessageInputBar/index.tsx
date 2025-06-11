import React, { useState, useRef, useEffect } from "react";
import { CardWrapper } from "../ui/common-styles";
import { XStack, YStack, Text, useIsomorphicLayoutEffect } from "tamagui";
import { Plus, SendHorizontal, X } from "@tamagui/lucide-icons";
import { FilledButton } from "../ui/Buttons";
import { InputField, TextareaField } from "../Form";
import { NativeSyntheticEvent, TextInputChangeEventData, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { PopoverWrapper } from "../PopoverWrapper";
import AddPopoverContents from "./AddPopoverContents";

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  data: File | string; // File for web, base64 string for native
  uri?: string; // For displaying images in native
}

const MessageInputBar = () => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
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

    const fileItems: AttachedFile[] = [];

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

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <CardWrapper
      p={"$3"}
      rounded={"$3"}
    >
      {attachedFiles.length > 0 && (
        <YStack
          gap={"$2"}
          mb={"$2"}
        >
          <XStack
            gap={"$2"}
            flexWrap="wrap"
          >
            {attachedFiles.map((file, index) => (
              <XStack
                key={`${file.name}-${index}`}
                bg={"$color4"}
                px={"$2"}
                py={"$1"}
                rounded={"$2"}
                gap={"$1"}
                items="center"
              >
                <Text
                  fontSize={12}
                  numberOfLines={1}
                  style={{ maxWidth: 150 }}
                >
                  {file.name}
                </Text>
                <FilledButton
                  icon={<X size={12} />}
                  size={"$1"}
                  height={18}
                  width={18}
                  onPress={() => removeAttachedFile(index)}
                />
              </XStack>
            ))}
          </XStack>
        </YStack>
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
          <AddPopoverContents />
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
