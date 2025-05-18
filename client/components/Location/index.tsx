import { MapPin, Navigation } from "@tamagui/lucide-icons";
import { Text, XStack, YStack } from "tamagui";

import * as Location from "expo-location";

const LocationInput = ({
  cb
}: {
  cb: (location: { status: string; error?: string; location?: Location.LocationObject }) => void;
}) => {
  async function askForLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      cb({ status: "denied", error: "Permission to access location was denied" });
      return;
    }

    await getCurrentLocation();
  }

  async function getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({});
    cb({ status: "granted", location });
  }

  return (
    <YStack
      gap="$2"
      onPress={askForLocation}
      cursor={"pointer"}
    >
      <Text fontSize={"$3"}>Location</Text>
      <XStack
        gap={"$2"}
        borderWidth={1}
        borderColor="$borderColor"
        rounded={"$4"}
        p={"$2.5"}
        px={"$3"}
        items={"center"}
      >
        <MapPin size={20} />
        <Text
          fontSize={"$3"}
          color={"$color10"}
        >
          Use current location
        </Text>
        <Navigation
          size={20}
          ml={"auto"}
        />
      </XStack>
    </YStack>
  );
};

export default LocationInput;
