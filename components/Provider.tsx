import { TamaguiProvider, createTamagui } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import config from "../tamagui.config";
import { PortalProvider } from "@gorhom/portal";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config}>
        <PortalProvider>{children}</PortalProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
