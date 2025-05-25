import { Spinner } from "tamagui";

const Loader = ({ size = "small", color = "$accent11" }: { size?: "small" | "large"; color?: string }) => {
  return (
    <Spinner
      size={size}
      color={color}
    />
  );
};

export default Loader;
