import "../tamagui-web.css";
import "react-native-reanimated";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import { ToastProvider, ToastViewport } from "@tamagui/toast";

import Provider from "@/components/Provider";
import { Theme, View } from "tamagui";
import SafeAreaToastViewport from "@/components/SafeAreaToasViewport";
import CurrentToast from "@/components/CurrentToast";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [interLoaded, interError] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf")
  });

  useEffect(() => {
    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync();
    }
  }, [interLoaded, interError]);

  if (!interLoaded && !interError) {
    return null;
  }

  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <Provider>{children}</Provider>;
};

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();

  return (
    <Theme name={"dark"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ToastProvider
          burntOptions={{ from: "bottom" }}
          duration={3000}
        >
          <Stack screenOptions={{ header: () => null }}>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="map" />
            <Stack.Screen name="onboarding" />
          </Stack>

          <StatusBar style="auto" />
          <CurrentToast />
          <SafeAreaToastViewport />
        </ToastProvider>
      </ThemeProvider>
    </Theme>
  );
};
