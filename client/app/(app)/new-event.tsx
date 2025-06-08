import { InputGroup } from "@/components/Form";
import { IAddress } from "@/definitions/types";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { H4, View, XStack, YStack } from "tamagui";

import { OutlineButton } from "@/components/ui/Buttons";
import DateRangePicker from "@/components/DatePicker";
import { BackButtonHeader } from "@/components/ui/common-components";

interface IFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: IAddress;
  images: string[];
  tags: string[];
}

const NewEvent = () => {
  const router = useRouter();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<IFormData>({});

  return (
    <YStack
      p={"$4"}
      gap={"$4"}
    >
      <BackButtonHeader
        title="Create New Event"
        navigateTo="/home"
      />
      <YStack
        gap={"$4"}
        mt={"$4"}
      >
        <InputGroup
          control={control}
          name={"name"}
          label={"Event Name"}
          placeHolder={"Enter event name"}
          rules={{
            required: "Event name is required"
          }}
          error={errors.name?.message}
        />

        <OutlineButton
          onPress={() => {
            setShowDatePicker(true);
          }}
        >
          show picker
        </OutlineButton>
        <DateRangePicker />

        <XStack></XStack>
      </YStack>
    </YStack>
  );
};

export default NewEvent;
