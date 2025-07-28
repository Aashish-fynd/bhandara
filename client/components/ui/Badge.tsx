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
  animation: "quick",
  pressStyle: {
    scale: 0.95,
    opacity: 0.8
  },
  hoverStyle: {
    scale: 1.05,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  transition: "all 0.2s ease-out",

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
        badgeColor: "$color8",
        hoverStyle: {
          bg: "$color2",
          borderColor: "$color9",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      }
    },
    success: {
      true: {
        bg: "$green11",
        borderColor: "$green1",
        color: "$green11",
        badgeColor: "$green11",
        hoverStyle: {
          bg: "$green10",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      }
    },
    danger: {
      true: {
        bg: "$red11",
        borderColor: "$red1",
        color: "$red11",
        badgeColor: "$red11",
        hoverStyle: {
          bg: "$red10",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      }
    },
    "outline-success": {
      true: {
        bg: "$green4",
        borderColor: "$green11",
        color: "$green11",
        badgeColor: "$green11",
        hoverStyle: {
          bg: "$green5",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      }
    },
    "outline-danger": {
      true: {
        bg: "$red3",
        borderColor: "$red8",
        color: "$red8",
        hoverStyle: {
          bg: "$red4",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
      }
    },
    "outline-warning": {
      true: {
        bg: "$yellow3",
        borderColor: "$yellow9",
        color: "$yellow9",
        hoverStyle: {
          bg: "$yellow4",
          scale: 1.05,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }
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
  animation: "lazy",
  variants: {
    color: {}
  }
});

const ButtonIcon = (props: { children: React.ReactElement }) => {
  const { badgeColor = "$color1" } = React.useContext(BadgeContext);

  return React.cloneElement(props.children, {
    color: badgeColor,
    animation: "bouncy"
  });
};

export const Badge = withStaticProperties(BadgeFrame, {
  Props: BadgeContext.Provider,
  Text: BadgeText,
  Icon: ButtonIcon
});
