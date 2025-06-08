import { Button, styled } from "tamagui";

const ButtonBase = styled(Button, {
  animation: "lazy",
  animationDuration: "100ms",
  variants: {
    danger: {
      true: {
        bg: "$red6",
        color: "$red11",
        hoverStyle: { bg: "$red7", borderColor: "$red7" }
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed"
      },
      false: {
        opacity: 1,
        cursor: "pointer"
      }
    },
    size: {
      medium: {
        fontSize: "$4",
        px: "$3",
        py: "$1.5",
        height: "min-content"
      },
      small: {
        fontSize: "$3",
        px: "$2",
        py: "$0",
        height: "min-content"
      }
    }
  } as const
});

export const FilledButton = styled(ButtonBase, {
  bg: "$accent1",
  rounded: 1000,
  color: "$accent12",
  hoverStyle: { bg: "$accent2", borderColor: "$accent2" },
  height: "auto",
  pt: "$2.5",
  pb: "$2.5",
  width: "100%"
});

export const OutlineButton = styled(ButtonBase, {
  rounded: 1000,
  height: "auto",
  pt: "$2.5",
  pb: "$2.5",
  borderColor: "$color8"
});
