import { ToastViewport } from "@tamagui/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SafeAreaToastViewport = () => {
  const { left, top, right, bottom } = useSafeAreaInsets();
  return (
    <ToastViewport
      flexDirection="column-reverse"
      multipleToasts={true}
      left={left}
      right={right}
      top={top}
    />
  );
};

export default SafeAreaToastViewport;
