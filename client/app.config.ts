import "ts-node/register"; // Add this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "bhandara",
  slug: "bhandara",
  plugins: [
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: ""
      }
    ],
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
      "expo-image-picker",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        cameraPermission: "Allow $(PRODUCT_NAME) to access your camera."
      }
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
        isAndroidBackgroundLocationEnabled: true
      }
    ],
    "react-native-compressor",
  ],
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.anonymous.bhandara"
  },
  scheme: "com.anonymous.bhandara",
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
  icon: "./assets/images/icon.png",
  extra: {
    eas: {
      projectId: "259f5464-f305-47f9-bb02-abf41276e4f7"
    }
  }
};

export default config;
