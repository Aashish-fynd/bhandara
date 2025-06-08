import { SafeAreaView } from "react-native-safe-area-context";
import { Dialog, Popover, styled, YStack } from "tamagui";

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
  borderWidth: 1,
  borderColor: "$borderColor",
  enterStyle: { y: -10, opacity: 0 },
  exitStyle: { y: -10, opacity: 0 },
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
    }
  }
});
