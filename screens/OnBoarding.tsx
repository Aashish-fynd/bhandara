import GoogleIcon from "@/assets/svg/GoogleIcon";
import { ChevronDown, Github } from "@tamagui/lucide-icons";
import React, { memo, useState } from "react";
import { Button, Image, Input, Sheet, StackProps, styled, Text, XStack, YStack } from "tamagui";

const OvalCard = ({ image, width, height }: { image: string; width: number; height?: number }) => {
  return (
    <Image
      source={{
        uri: image,
        width: width,
        height: height ? height : width * 1.3
      }}
      rounded={10000}
      overflow={"hidden"}
    />
  );
};

type OvalCardConfig = {
  image: string;
  width: number;
  height?: number;
};

type OnBoardingConfig = {
  stacks: {
    gap?: StackProps["gap"];
    flexDirection?: "column" | "column-reverse";
    items?: StackProps["items"];
    justify?: StackProps["justify"];
    cards: OvalCardConfig[];
  }[];
};

const defaultConfig: OnBoardingConfig = {
  stacks: [
    {
      gap: "$4",
      items: "center",
      justify: "center",
      cards: [
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 80
        },
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 140
        }
      ]
    },
    {
      gap: "$4",
      flexDirection: "column-reverse",
      items: "center",
      justify: "center",
      cards: [
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 80
        },
        {
          image: "https://images.unsplash.com/photo-1743527173859-2cf44e80cef8?q=80&w=200&auto=format&fit=crop",
          width: 140
        }
      ]
    }
  ]
};

const RoundedButton = styled(Button, {
  bg: "$accent1",
  rounded: 1000,
  color: "$accent12",
  hoverStyle: { bg: "$accent2", borderColor: "$accent2" },
  flex: 1,
  height: "auto",
  ml: "auto",
  mr: "auto",
  pt: "$2.5",
  pb: "$2.5",
  width: "100%",
  maxW: 300
});

const SheetContents = memo(({ setPosition }: any) => {
  return (
    <YStack
      gap="$2"
      items={"center"}
      width={"100%"}
    >
      <RoundedButton icon={<Github size={20} />}>
        <Text
          fontSize={"$2"}
          color={"$accent12"}
        >
          Continue with GitHub
        </Text>
      </RoundedButton>
      <RoundedButton icon={<GoogleIcon size={20} />}>
        <Text
          fontSize={"$2"}
          color={"$accent12"}
        >
          Continue with Google
        </Text>
      </RoundedButton>
    </YStack>
  );
});

const OnBoarding = ({ config = defaultConfig }: { config?: OnBoardingConfig }) => {
  const [position, setPosition] = useState(2);
  return (
    <>
      <XStack
        gap={"$4"}
        items={"center"}
        justify={"center"}
      >
        {config.stacks.map((stack, i) => (
          <YStack
            key={i}
            gap={stack.gap ?? "$2"}
            flexDirection={stack.flexDirection || "column"}
            items={stack.items}
            justify={stack.justify}
          >
            {stack.cards.map((card, j) => (
              <OvalCard
                key={j}
                {...card}
              />
            ))}
          </YStack>
        ))}
      </XStack>

      <Sheet
        modal={false}
        open={true}
        zIndex={100_000}
        animation={"quick"}
        dismissOnOverlayPress={false}
        dismissOnSnapToBottom={false}
        snapPoints={[90, 70, 50]}
        onPositionChange={setPosition}
        position={position}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          bg={"transparent"}
        />

        <Sheet.Handle
          bg={"$accent12"}
          opacity={0.9}
        />
        <Sheet.Frame
          p="$4"
          justify="flex-start"
          items="center"
          gap="$5"
          bg={"$accent12"}
          width={"100%"}
        >
          <SheetContents {...{ setPosition }} />
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default OnBoarding;
