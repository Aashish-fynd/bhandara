import { TamaguiProvider } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import config from "../tamagui.config";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config}>{children}</TamaguiProvider>
    </SafeAreaProvider>
  );
}
