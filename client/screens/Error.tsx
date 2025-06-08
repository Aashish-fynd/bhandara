import { Link, useLocalSearchParams } from "expo-router";
import React from "react";
import { View, Text, YStack, Paragraph, H4, H2 } from "tamagui";

interface IProps {
  title?: string;
  description?: string;
  errorCode?: string;
}
const ErrorComponent = ({ title, description, errorCode }: IProps) => {
  const _title = title || "Oops! You have found the lost world!";
  const _description = description || "Home is just a click away. Let's go back and continue our regular life";
  const _errorCode = errorCode || 404;

  return (
    <YStack
      height={"100%"}
      gap={"$4"}
      p="$4"
      items={"center"}
      bg="$background"
    >
      <View></View>
      <YStack
        flex={1}
        justify={"center"}
        gap={"$4"}
      >
        <H2 text={"center"}>{_title}</H2>
        <Paragraph text={"center"}>{_description}</Paragraph>
        <Link
          href="/home"
          style={{
            marginTop: 10,
            textAlign: "center"
          }}
        >
          <Text fontWeight={"300"}>Go to Home</Text>
        </Link>
      </YStack>
      <Text fontSize={"$3"}>Error code {_errorCode}</Text>
    </YStack>
  );
};

export default ErrorComponent;
