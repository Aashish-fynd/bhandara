import { BASE_AVATAR_URL } from "@/constants/global";
import { CheckCircle, CircleCheck } from "@tamagui/lucide-icons";
import React, { useState } from "react";
import { Image, Text, View, XStack, YStack } from "tamagui";

const AvatarSelection = ({ cb }: { cb: (avatar: string) => void }) => {
  const avatars = Array.from({ length: 15 }, (_, index) => BASE_AVATAR_URL.replace("{num}", (index + 1).toString()));
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);

  return (
    <YStack gap="$2">
      <Text fontSize={"$3"}>Avatar</Text>
      <XStack
        gap={"$4"}
        overflow="scroll"
      >
        {avatars.map((avatar, index) => (
          <View
            key={index}
            position="relative"
            onPress={() => {
              setSelectedAvatarIndex(index);
              cb(avatar);
            }}
            rounded={"$4"}
            cursor="pointer"
            bg={"$accent11"}
          >
            <Image
              source={{ uri: avatar }}
              width={"$10"}
              height={"$10"}
            />

            {selectedAvatarIndex === index && (
              <View
                position="absolute"
                b={"$2"}
                r={"$2"}
                enterStyle={{ opacity: 0, scale: 0.9 }}
                exitStyle={{ opacity: 0, scale: 0.9 }}
                animation={"quick"}
              >
                <CircleCheck size={20} />
              </View>
            )}
          </View>
        ))}
      </XStack>
    </YStack>
  );
};

export default AvatarSelection;
