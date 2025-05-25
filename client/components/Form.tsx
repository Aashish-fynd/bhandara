import { Control, Controller } from "react-hook-form";
import { Input, Paragraph, Text, YStack, XStack, View } from "tamagui";
import React from "react";

export const InputGroup = ({
  control,
  rules,
  error,
  placeHolder,
  name,
  label,
  rightLabel,
  onChange,
  inputProps,
  iconBefore,
  iconAfter,
  containerProps
}: {
  control: Control<any>;
  rules: any;
  error: any;
  placeHolder: string;
  name: string;
  label: string;
  rightLabel?: string;
  onChange?: (value: any) => void;
  inputProps?: React.ComponentProps<typeof Input>;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  containerProps?: React.ComponentProps<typeof YStack>;
}) => {
  return (
    <View
      gap="$2"
      flex={1}
      shrink={0}
      maxH={"min-content"}
      {...(containerProps || {})}
    >
      <XStack
        gap="$2"
        justify="space-between"
        items="center"
      >
        <Text fontSize={"$3"}>{label}</Text>
        {rightLabel && (
          <Paragraph
            size="$1"
            color="$color8"
          >
            {rightLabel}
          </Paragraph>
        )}
      </XStack>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field }) => (
          <XStack
            borderWidth={1}
            borderColor={"$borderColor"}
            rounded={"$4"}
            overflow={"hidden"}
            focusWithinStyle={{ outlineWidth: 2, outlineColor: "$color7", outlineStyle: "solid" }}
            gap={"$3"}
            position={"relative"}
            items="center"
            px={"$3.5"}
            bg={inputProps?.bg || "$background02"}
          >
            {iconBefore}
            <Input
              rounded={0}
              borderWidth={0}
              borderColor={"transparent"}
              placeholder={placeHolder}
              value={field.value}
              display={"flex"}
              flex={1}
              focusVisibleStyle={{ outline: "none" }}
              outline="none"
              px={0}
              focusStyle={null}
              focusWithinStyle={null}
              autoComplete={inputProps?.secureTextEntry ? "off" : inputProps?.autoComplete}
              onChangeText={(value) => {
                field.onChange(value);
                onChange?.(value);
              }}
              {...(inputProps || {})}
            />
            {iconAfter}
          </XStack>
        )}
      />
      {error && (
        <Text
          color="$red10"
          fontSize="$1"
          width={"auto"}
        >
          {error.message}
        </Text>
      )}
    </View>
  );
};
