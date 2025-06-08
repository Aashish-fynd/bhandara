import { Card, styled } from "tamagui";

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
  p: "$4"
});
