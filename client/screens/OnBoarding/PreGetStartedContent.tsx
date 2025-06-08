import React, { useState } from "react";
import { GET_STARTED_TABS } from "./constants";
import { Text, View, XStack, YStack } from "tamagui";
import { OutlineButton } from "@/components/ui/Buttons";

interface IProps {
  setShowAuthOptions: (show: boolean) => void;
}

const PreGetStartedContent = ({ setShowAuthOptions }: IProps) => {
  const [currentTab, setCurrentTab] = useState(0);
  return (
    <>
      <YStack gap={"$3"}>
        <Text fontSize={"$9"}>{GET_STARTED_TABS[currentTab].title}</Text>
        <Text
          fontSize={"$2"}
          fontWeight={"100"}
          color={"$accent9"}
        >
          {GET_STARTED_TABS[currentTab].description}
        </Text>
        {GET_STARTED_TABS[currentTab].renderComponent()}
      </YStack>

      <XStack
        items={"center"}
        justify={"space-between"}
      >
        <XStack gap={"$3"}>
          {Array.from({ length: GET_STARTED_TABS.length }).map((_, i) => (
            <View
              key={i}
              onPress={() => setCurrentTab(i)}
              bg={currentTab !== i ? "$accent10" : "$accent1"}
              rounded={"$12"}
              width={"$3"}
              height={"$0.75"}
              cursor={"pointer"}
            />
          ))}
        </XStack>

        <OutlineButton
          width={"auto"}
          onPress={() => {
            const isLastTab = currentTab === GET_STARTED_TABS.length - 1;
            if (isLastTab) {
              setShowAuthOptions(true);
            } else setCurrentTab(currentTab + 1);
          }}
        >
          <Text fontSize={"$2"}>Next</Text>
        </OutlineButton>
      </XStack>
    </>
  );
};

export default PreGetStartedContent;
