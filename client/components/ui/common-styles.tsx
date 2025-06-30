import { Card, Dialog, Popover, styled, View, YStack } from "tamagui";

export const DialogContent = styled(Dialog.Content, {
  bordered: true,
  elevate: true,
  animateOnly: ["transform", "opacity"],
  animation: [
    "quick",
    {
      opacity: {
        overshootClamping: true
      }
    }
  ],
  enterStyle: { x: 0, y: 20, opacity: 0 },
  exitStyle: { x: 0, y: 10, opacity: 0, scale: 0.95 },
  z: 200
});

export const PopoverContent = styled(Popover.Content, {
  enterStyle: { y: -10, opacity: 0 },
  exitStyle: { y: -10, opacity: 0 },
  bg: "transparent",
  elevate: true,
  animation: [
    "quick",
    {
      opacity: {
        overshootClamping: true
      }
    }
  ]
});

export const Badge = styled(YStack, {
  bg: "$color12",
  rounded: "$2",
  px: "$2",
  py: "$1",
  style: {
    color: "$color1"
  },
  borderWidth: 1,
  borderColor: "$color12",
  height: "min-content",

  variants: {
    outline: {
      true: {
        borderColor: "$color8",
        bg: "$background"
      }
    },
    success: {
      true: {
        bg: "$green11",
        borderColor: "$green1"
      }
    },
    danger: {
      true: {
        bg: "$red11",
        borderColor: "$red1"
      }
    },
    "outline-success": {
      true: {
        bg: "$green7",
        borderColor: "$green11"
      }
    },
    "outline-danger": {
      true: {
        bg: "$red3",
        borderColor: "$red8"
      }
    }
  } as const
});

export const CardWrapper = styled(Card, {
  elevate: true,
  bordered: true,
  bg: "$background",
  self: "center",
  rounded: "$6",
  shadowColor: "$color11",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  overflow: "hidden",
  p: "$4",
  width: "100%",
  gap: "$2",

  variants: {
    size: {
      medium: {
        p: "$3",
        rounded: "$4"
      },
      small: {
        p: "$2",
        rounded: "$2"
      }
    } as const
  }
});

export const CircleBgWrapper = styled(View, {
  items: "center",
  justify: "center",
  display: "flex",
  bg: "$color",
  rounded: "$12",
  variants: {
    size: {
      "...size": (size, { tokens }) => {
        return {
          width: (tokens.size as any)[size] ?? size,
          height: (tokens.size as any)[size] ?? size
        };
      }
    }
  } as const
});
