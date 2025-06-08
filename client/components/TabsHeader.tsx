import React from "react";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Avatar, H3, H4, Text, View, XStack, YStack } from "tamagui";
import { Bell } from "@tamagui/lucide-icons";
import { useAuth } from "@/contexts/AuthContext";
import CustomAvatar from "./CustomAvatar";
import { PopoverWrapper } from "./PopoverWrapper";
import UserProfilePopover from "./UserProfile/PopoverContents";

const TabsHeader = ({ navigation }: BottomTabHeaderProps) => {
  const { user } = useAuth();

  return (
    <XStack
      justify={"space-between"}
      p={"$3"}
      items={"center"}
    >
      <XStack
        items={"center"}
        gap={"$2"}
        cursor={"pointer"}
        onPress={() => navigation.navigate("home")}
      >
        <CustomAvatar
          src={""} // TODO: Create logo
          alt="Bhandara logo"
          bordered={false}
        />
        <H4 fontWeight={"300"}>Bhandara</H4>
      </XStack>

      <XStack
        items={"center"}
        gap={"$4"}
      >
        <View
          bg={"$color5"}
          p={"$2"}
          rounded={1000}
          cursor={"pointer"}
        >
          <Bell
            size={20}
            color={"$color"}
          />
        </View>

        <PopoverWrapper
          trigger={
            <View cursor={"pointer"}>
              <CustomAvatar
                src={user?.profilePic?.url || ""}
                alt="User's profile picture"
              />
            </View>
          }
        >
          <UserProfilePopover />
        </PopoverWrapper>
      </XStack>
    </XStack>
  );
};

export default TabsHeader;
