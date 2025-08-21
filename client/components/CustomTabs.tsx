import { ScrollView, SizableText, XStack } from "tamagui";

import { kebabCase } from "@/utils";
import { Tabs } from "tamagui";
import React from "react";

interface IProps {
  tabs: {
    label: string;
    icon?: React.ReactElement;
    content: React.ReactNode;
  }[];
  defaultValue: string;
  cb?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const HorizontalTabs = ({ tabs, defaultValue, cb, orientation = "horizontal" }: IProps) => {
  return (
    <Tabs
      defaultValue={defaultValue}
      orientation={orientation}
      flexDirection={orientation !== "horizontal" ? "row" : "column"}
      flex={1}
      gap={"$5"}
      animation="lazy"
    >
      <Tabs.List
        disablePassBorderRadius="bottom"
        aria-label="Manage your account"
        rounded={"$4"}
        $gtMd={{ maxW: 500 }}
        width={350}
        maxW={350}
        borderWidth={"$0.25"}
        borderColor="$borderColor"
        overflow="hidden"
        self={"center"}
        animation="bouncy"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={2}
      >
        {tabs.map((tab) => {
          const _uniqueKey = kebabCase(tab.label);
          return (
            <Tabs.Tab
              focusStyle={{
                backgroundColor: "$color3"
              }}
              flex={1}
              width={"100%"}
              height={"$3"}
              value={_uniqueKey}
              onPress={() => {
                cb?.(_uniqueKey);
              }}
              key={_uniqueKey}
              animation="quick"
              pressStyle={{
                scale: 0.95,
                opacity: 0.8
              }}
              hoverStyle={{
                bg: "$color2",
                scale: 1.02
              }}
            >
              <XStack
                gap={"$2"}
                alignItems={"center"}
                animation="lazy"
              >
                {tab.icon &&
                  React.cloneElement(tab.icon, {
                    size: 16,
                    animation: "bouncy"
                  })}
                <SizableText
                  fontFamily="$body"
                  text="center"
                  animation="lazy"
                >
                  {tab.label}
                </SizableText>
              </XStack>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {tabs.map((tab) => {
        return (
          <Tabs.Content
            flex={1}
            value={kebabCase(tab.label)}
            alignItems={"stretch"}
            key={kebabCase(tab.label)}
            animation="lazy"
            enterStyle={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            exitStyle={{
              opacity: 0,
              scale: 0.95,
              y: -10
            }}
          >
            <ScrollView
              flex={1}
              width={"100%"}
              height={"100%"}
              animation="lazy"
            >
              {tab.content}
            </ScrollView>
          </Tabs.Content>
        );
      })}
    </Tabs>
  );
};

export default HorizontalTabs;
