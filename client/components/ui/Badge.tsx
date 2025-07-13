import React, { useContext } from "react";
import { createStyledContext, getTokens, styled, Text, useTheme, withStaticProperties, YStack } from "tamagui";

// Create a styled context for Badge to pass color to children
const BadgeContext = createStyledContext<{ badgeColor?: string }>({
  badgeColor: undefined
});

export const BadgeFrame = styled(YStack, {
  name: "Badge",
  context: BadgeContext,
  bg: "$color12",
  rounded: "$6",
  px: "$2",
  py: "$1",
  borderWidth: 1,
  borderColor: "$color12",
  height: "min-content",
  display: "flex",
  flexDirection: "row",
  items: "center",
  gap: "$1",

  variants: {
    __default: {
      true: {
        color: "$color1"
      }
    },
    outline: {
      true: {
        borderColor: "$color8",
        bg: "$background",
        color: "$color8",
        badgeColor: "$color8"
      }
    },
    success: {
      true: {
        bg: "$green11",
        borderColor: "$green1",
        color: "$green11",
        badgeColor: "$green11"
      }
    },
    danger: {
      true: {
        bg: "$red11",
        borderColor: "$red1",
        color: "$red11",
        badgeColor: "$red11"
      }
    },
    "outline-success": {
      true: {
        bg: "$green4",
        borderColor: "$green11",
        color: "$green11",
        badgeColor: "$green11"
      }
    },
    "outline-danger": {
      true: {
        bg: "$red3",
        borderColor: "$red8",
        color: "$red8"
      }
    },
    "outline-warning": {
      true: {
        bg: "$yellow3",
        borderColor: "$yellow9",
        color: "$yellow9"
      }
    }
  } as const,
  defaultVariants: {
    __default: true
  } as const
});

// Create a BadgeText component that uses the context
export const BadgeText = styled(Text, {
  name: "BadgeText",
  context: BadgeContext,
  fontSize: "$2",
  variants: {
    color: {}
  }
});

const ButtonIcon = (props: { children: React.ReactElement }) => {
  const { badgeColor = "$color1" } = React.useContext(BadgeContext);

  return React.cloneElement(props.children, {
    color: badgeColor
  });
};

export const Badge = withStaticProperties(BadgeFrame, {
  Props: BadgeContext.Provider,
  Text: BadgeText,
  Icon: ButtonIcon
});
