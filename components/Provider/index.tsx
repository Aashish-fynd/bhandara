import { useColorScheme } from "react-native";
import { TamaguiProvider, TamaguiProviderProps } from "tamagui";

const tamaguiConfig = require("@/tamagui.config").default;

const Provider = ({
  children,
  ...rest
}: Omit<TamaguiProviderProps, "config">) => {
  const colorScheme = useColorScheme();
  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={colorScheme!}
      {...rest}
    >
      {children}
    </TamaguiProvider>
  );
};

export default Provider;
