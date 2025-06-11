import { useAuth } from "@/contexts/AuthContext";
import { kebabCase } from "@/utils";
import { Calendar, LogOut, Settings } from "@tamagui/lucide-icons";
import { User } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React, { Fragment } from "react";
import { Popover, Separator, Text, XStack, YStack } from "tamagui";
import { PopoverContent } from "../ui/common-styles";
import ConfirmationDialog from "../ConfirmationDialog";
import { useDialog } from "@/hooks/useModal";
import { useToastController } from "@tamagui/toast";

const tabs = [
  {
    label: "Profile",
    icon: <User />
  },
  {
    label: "Settings",
    icon: <Settings />
  },
  {
    label: "My Events",
    icon: <Calendar />
  }
];

const groups = [
  {
    label: "General",
    tabs: tabs
  },
  {
    label: "Actions",
    tabs: [
      {
        label: "Logout",
        icon: <LogOut />,
        color: "$red11"
      }
    ]
  }
];

const UserProfilePopover = ({}) => {
  const { logout } = useAuth();
  const router = useRouter();
  const toastController = useToastController();

  const { open, close, RenderContent } = useDialog();

  const handleActionClick = (action: string) => {
    switch (action) {
      case "logout":
        open();
        break;
      case "settings":
        router.push("/profile?tab=settings");
        break;
      case "my-events":
        router.push("/profile?tab=my-events");
        break;
      case "profile":
        router.push("/profile?tab=info");
        break;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      close();
    } catch (error: any) {
      console.error(error);
      toastController.show(error?.error?.message || "Failed to logout");
    }
  };

  return (
    <>
      <PopoverContent
        mr="$4"
        p="$3"
      >
        <YStack gap="$3">
          {groups.map((group, index) => (
            <Fragment key={group.label + index}>
              <YStack
                key={group.label}
                gap={"$3"}
              >
                {group.tabs.map((tab) => (
                  <Popover.Close asChild>
                    <XStack
                      key={tab.label}
                      gap={"$4"}
                      items={"center"}
                      cursor={"pointer"}
                      onPress={() => handleActionClick(kebabCase(tab.label))}
                    >
                      {React.cloneElement(tab.icon, {
                        size: 16,
                        color: (tab as any)?.color
                      })}
                      <Text
                        fontSize={"$3"}
                        color={(tab as any)?.color}
                      >
                        {tab.label}
                      </Text>
                    </XStack>
                  </Popover.Close>
                ))}
              </YStack>
              {index !== groups.length - 1 && <Separator />}
            </Fragment>
          ))}
        </YStack>
      </PopoverContent>

      <RenderContent>
        <ConfirmationDialog
          title="Logout"
          description="Are you sure you want to logout?"
          onClose={() => {}}
          onConfirm={handleLogout}
          asDanger
        />
      </RenderContent>
    </>
  );
};

export default UserProfilePopover;
