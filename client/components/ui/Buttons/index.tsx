import { Button, styled } from "tamagui";

const ButtonBase = styled(Button, {
  animation: "bouncy",
  animationDuration: "200ms",
  pressStyle: {
    scale: 0.95,
    opacity: 0.8,
    y: 2
  },
  hoverStyle: {
    scale: 1.02,
    y: -1
  },
  variants: {
    danger: {
      true: {
        bg: "$red6",
        color: "$red11",
        hoverStyle: { 
          bg: "$red7", 
          borderColor: "$red7",
          scale: 1.02,
          y: -1
        },
        pressStyle: {
          scale: 0.95,
          opacity: 0.8,
          y: 2
        }
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
        pressStyle: {
          scale: 1,
          opacity: 0.5,
          y: 0
        },
        hoverStyle: {
          scale: 1,
          y: 0
        }
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
  hoverStyle: { 
    bg: "$accent2", 
    borderColor: "$accent2",
    scale: 1.02,
    y: -1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  pressStyle: {
    scale: 0.95,
    opacity: 0.8,
    y: 2,
    bg: "$accent3"
  },
  height: "auto",
  pt: "$2.5",
  pb: "$2.5",
  width: "100%",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2
});

export const OutlineButton = styled(ButtonBase, {
  rounded: 1000,
  height: "auto",
  pt: "$2.5",
  pb: "$2.5",
  borderColor: "$color8",
  hoverStyle: {
    borderColor: "$color9",
    bg: "$color2",
    scale: 1.02,
    y: -1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  pressStyle: {
    scale: 0.95,
    opacity: 0.8,
    y: 2,
    bg: "$color3"
  }
});

export const IconButton = styled(ButtonBase, {
  borderRadius: "$4",
  padding: "$2",
  minWidth: "$4",
  minHeight: "$4",
  justifyContent: "center",
  alignItems: "center",
  hoverStyle: {
    bg: "$color3",
    scale: 1.1,
    rotate: "5deg"
  },
  pressStyle: {
    scale: 0.9,
    rotate: "-5deg"
  },
  animation: "superBouncy"
});

export const FloatingActionButton = styled(ButtonBase, {
  position: "absolute",
  bottom: "$4",
  right: "$4",
  width: "$6",
  height: "$6",
  borderRadius: "$12",
  bg: "$accent1",
  color: "$accent12",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
  hoverStyle: {
    scale: 1.1,
    y: -2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12
  },
  pressStyle: {
    scale: 0.9,
    y: 0
  },
  animation: "superBouncy"
});
