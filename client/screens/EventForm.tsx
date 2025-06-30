import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocalSearchParams, useRouter } from "expo-router";
import { InputGroup } from "@/components/Form";
import { FilledButton } from "@/components/ui/Buttons";
import { CardWrapper } from "@/components/ui/common-styles";
import { getEventById, createEvent, updateEvent } from "@/common/api/events.action";
import { EEventStatus } from "@/definitions/enums";
import { View, YStack } from "tamagui";

const EventForm = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { name: "", description: "" } });

  useEffect(() => {
    if (id) {
      getEventById(id as string).then((res) => {
        if (res.data) {
          reset({ name: res.data.name, description: res.data.description });
        }
      });
    }
  }, [id]);

  const onSubmit = async (values: any) => {
    if (id) {
      await updateEvent(id as string, values);
    } else {
      const draft = await createEvent({ ...values, status: EEventStatus.Draft });
      if (draft.data?.id) {
        await updateEvent(draft.data.id, { status: EEventStatus.Upcoming });
      }
    }
    router.back();
  };

  return (
    <View p="$4">
      <CardWrapper gap="$4">
        <InputGroup control={control} name="name" label="Name" placeHolder="Event name" error={null} />
        <InputGroup control={control} name="description" label="Description" placeHolder="Event description" error={null} />
        <FilledButton onPress={handleSubmit(onSubmit)} size="medium">
          Save
        </FilledButton>
      </CardWrapper>
    </View>
  );
};

export default EventForm;
