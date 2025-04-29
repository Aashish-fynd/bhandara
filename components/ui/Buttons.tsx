import { Button, styled } from "tamagui";

export const FilledButton = styled(Button, {
  bg: "$accent1",
  rounded: 1000,
  color: "$accent12",
  hoverStyle: { bg: "$accent2", borderColor: "$accent2" },
  height: "auto",
  ml: "auto",
  mr: "auto",
  pt: "$2.5",
  pb: "$2.5",
  width: "100%"
});

export const BaseButton = styled(Button, {
  rounded: 1000,
  height: "auto",
  pt: "$2.5",
  pb: "$2.5"
});
