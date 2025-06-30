import { createTamagui } from "tamagui";
import { defaultConfig } from "@tamagui/config/v4";
import { createInterFont } from "@tamagui/font-inter";
import { animations } from "./animations";

const headingFont = createInterFont({
  weight: {
    regular: "400",
    medium: "500",
    bold: "700"
  }
});

const bodyFont = createInterFont({
  weight: {
    regular: "400",
    medium: "500",
    bold: "700"
  }
});

const config = createTamagui({
  ...defaultConfig,
  animations,
  defaultTheme: "dark",
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  fonts: {
    heading: headingFont,
    body: bodyFont
  },
  defaultProps: {
    Label: {
      lineHeight: "auto"
    },
    Paragraph: {
      lineHeight: "auto"
    }
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" }
  }
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
