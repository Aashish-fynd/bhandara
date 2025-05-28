import { EGender } from "@/definitions/enums";
import { startCase } from "@/utils";
import { Mars, Venus } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";

const genders = [
  {
    value: EGender.Male,
    icon: Mars
  },
  {
    value: EGender.Female,
    icon: Venus
  }
];
const GenderSelection = ({ cb, preSelectedGender }: { cb: (gender: string) => void; preSelectedGender?: string }) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(() => {
    const gender = genders.find((gender) => gender.value === preSelectedGender);
    return gender ? gender.value : null;
  });

  return (
    <YStack
      gap={"$3"}
      width={"100%"}
    >
      <Text fontSize={"$2"}>Gender</Text>
      <XStack
        gap={"$3"}
        items={"center"}
        width={"100%"}
      >
        {genders.map((gender) => (
          <XStack
            gap={"$2"}
            items={"center"}
            key={gender.value}
            onPress={() => {
              setSelectedGender(gender.value);
              cb(gender.value);
            }}
            borderWidth={1}
            borderColor={selectedGender === gender.value ? "$color7" : "$borderColor"}
            bg={selectedGender === gender.value ? "$accent1" : "transparent"}
            flex={1}
            px={"$3"}
            py={"$2"}
            rounded={"$3"}
            cursor={"pointer"}
          >
            <gender.icon color={selectedGender === gender.value ? "$color7" : "$color11"} />
            <Text
              color={selectedGender === gender.value ? "$color7" : "$color11"}
              fontSize={"$2"}
            >
              {startCase(gender.value)}
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
};

export default GenderSelection;
