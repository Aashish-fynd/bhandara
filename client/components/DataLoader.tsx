import { useDataLoader } from "@/hooks";
import { View, Text, Spinner } from "tamagui";

const DataLoader = ({
  promiseFunc,
  onSuccess,
  children,
  size = "small",
  onError
}: {
  promiseFunc: () => Promise<any>;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  children: React.ReactNode;
  size?: "small" | "large";
}) => {
  const { loading } = useDataLoader(promiseFunc, onSuccess, onError);

  if (loading) {
    return (
      <View
        height={"100%"}
        width={"100%"}
        justify="center"
        items="center"
      >
        <Spinner
          size={size}
          color={"inherit"}
        />
      </View>
    );
  }

  return children;
};

export default DataLoader;
