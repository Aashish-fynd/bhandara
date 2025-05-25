import { Mars, Venus } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Text, XStack } from "tamagui";

const genders = [
  {
    value: "Male",
    icon: Mars
  },
  {
    value: "Female",
    icon: Venus
  }
];
const GenderSelection = ({ cb }: { cb: (gender: string) => void }) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  return (
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
          onPress={() => setSelectedGender(gender.value.toLowerCase())}
          borderWidth={1}
          borderColor={selectedGender === gender.value.toLowerCase() ? "$color7" : "$borderColor"}
          bg={selectedGender === gender.value.toLowerCase() ? "$accent9" : "transparent"}
          flex={1}
        >
          <gender.icon color={selectedGender === gender.value.toLowerCase() ? "$color7" : "$color02"} />
          <Text
            color={selectedGender === gender.value.toLowerCase() ? "$color7" : "$color02"}
            fontSize={"$2"}
          >
            {gender.value}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
};

export default GenderSelection;
