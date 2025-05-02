import "ts-node/register"; // Add this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "bhandara",
  slug: "bhandara",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsVersion: "11.0.0",
        RNMapboxMapsDownloadToken:
          "sk.eyJ1IjoibWFwYm94MTEwOSIsImEiOiJjbWE2azFmYngwcW1zMnFxemJnMHp5aDVsIn0.N59_bXWC5uUM_k_wvu02mQ"
      }
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
        isAndroidBackgroundLocationEnabled: true
      }
    ]
  ],
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.anonymous.bhandara"
  },
  scheme: "com.supabase",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.bhandara"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  experiments: {
    typedRoutes: true
  },
  icon: "./assets/images/icon.png"
};

export default config;
