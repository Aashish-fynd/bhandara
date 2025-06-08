import { ScrollView, SizableText } from "tamagui";

import { kebabCase } from "@/utils";
import { Tabs } from "tamagui";

interface IProps {
  tabs: {
    label: string;
    icon: React.ReactNode;
    href: string;
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
      $gtMd={{ maxW: 500 }}
      width={350}
      maxW={350}
      flex={1}
      gap={"$5"}
    >
      <Tabs.List
        disablePassBorderRadius="bottom"
        aria-label="Manage your account"
        flex={1}
        width={"100%"}
        rounded={"$4"}
        borderWidth={"$0.25"}
        borderColor="$borderColor"
        overflow="hidden"
      >
        {tabs.map((tab) => {
          return (
            <Tabs.Tab
              focusStyle={{
                backgroundColor: "$color3"
              }}
              flex={1}
              width={"100%"}
              height={"$3"}
              value={kebabCase(tab.label)}
              onPress={() => {
                cb?.(kebabCase(tab.label));
              }}
            >
              <SizableText
                fontFamily="$body"
                text="center"
              >
                {tab.label}
              </SizableText>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {tabs.map((tab) => {
        return (
          <Tabs.Content
            flex={1}
            value={kebabCase(tab.label)}
          >
            <ScrollView
              flex={1}
              width={"100%"}
              height={"100%"}
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
