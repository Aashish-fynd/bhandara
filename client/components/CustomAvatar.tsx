import React from "react";
import { Avatar, Text, View } from "tamagui";

const CustomAvatar = ({
  size = 40,
  src,
  alt,
  bordered = true,
  fallbackGenerator
}: {
  size?: number | string;
  src: string;
  alt: string;
  bordered?: boolean;
  fallbackGenerator?: (alt: string) => string;
}) => {
  const extraStyles = bordered
    ? {
        width: (size as any) + 5,
        height: (size as any) + 5,
        borderColor: "$color11",
        borderWidth: "$0.5",
        p: "$1"
      }
    : {};
  return (
    <View
      rounded={"$12"}
      items={"center"}
      justify={"center"}
      {...(extraStyles as any)}
    >
      <Avatar
        circular
        size={size as any}
        group={true}
      >
        <Avatar.Image
          height={size as any}
          width={size as any}
          accessibilityLabel={alt}
          src={src}
          $group-hover={{
            scale: 1.05
          }}
          transition={"transform 0.2s ease-in-out"}
        />
        <Avatar.Fallback
          backgroundColor="$accent11"
          justify={"center"}
          items={"center"}
        >
          <Text
            fontSize={"$3"}
            color={"$color12"}
          >
            {fallbackGenerator ? fallbackGenerator(alt) : alt.charAt(0)}
          </Text>
        </Avatar.Fallback>
      </Avatar>
    </View>
  );
};

export default CustomAvatar;
