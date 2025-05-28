import React, { useCallback, useState } from "react";
import AvatarSelection from "./AvatarSelection";
import { InputGroup } from "@/components/Form";
import { FieldError, FieldErrors, UseFormSetError, UseFormSetValue } from "react-hook-form";
import { IFormData } from "./type";
import { Control } from "react-hook-form";
import { setNavState } from "@/lib/navigationStore";
import { router } from "expo-router";
import { isEmpty } from "@/utils";
import { debounce, getUUIDv4 } from "@/helpers";
import { getUserByUsername } from "@/common/api/user.action";
import { getAddressFromCoordinates } from "@/common/api/mapbox";
import { useToastController } from "@tamagui/toast";
import { Text, Tooltip, useDebounce, View } from "tamagui";
import * as Location from "expo-location";
import Loader from "@/components/ui/Loader";
import { CircleCheck, MapPin, SquareArrowOutUpRight } from "@tamagui/lucide-icons";
import GenderSelection from "./GenderSelection";

interface IProps {
  allValues: IFormData;
  setValue: UseFormSetValue<IFormData>;
  control: Control<IFormData>;
  errors: FieldErrors<IFormData>;
  setError: UseFormSetError<IFormData>;
}

const ProfileSetup = ({ allValues, setValue, control, errors, setError }: IProps) => {
  const [usernameLoading, setUsernameLoading] = useState<boolean>(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const toastController = useToastController();

  const _getSetLocationFromCoordinates = async (coordinates: { latitude: number; longitude: number }) => {
    setIsLocationLoading(true);
    try {
      const res = await getAddressFromCoordinates({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });

      if (!res) return;

      setValue("location", {
        ...res,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      setValue("_location", res.address);
    } catch (error: any) {
      toastController.show(error?.message || "Error getting location");
    } finally {
      setIsLocationLoading(false);
    }
  };
  const debouncedGetSetLocationFromCoordinates = useDebounce(_getSetLocationFromCoordinates, 300);

  async function askForLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      toastController.show("Permission to access location was denied");
      return;
    }

    await getCurrentLocation();
  }

  async function getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({});

    // if location is already set and didn't change, do nothing
    if (
      allValues.location?.latitude === location.coords.latitude &&
      allValues.location?.longitude === location.coords.longitude
    )
      return;

    debouncedGetSetLocationFromCoordinates.cancel();
    debouncedGetSetLocationFromCoordinates({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  }

  const _getUserByUsername = async (username: string) => {
    try {
      if (!username || errors?.username) return;
      setUsernameLoading(true);
      await getUserByUsername(username);
      setError("username", { type: "custom", message: "Username is already taken" });
    } catch (error) {
      setUsernameLoading(false);
      setIsUsernameAvailable(true);
    }
  };
  const handleEditLocation = () => {
    if (!isEmpty(allValues.location)) {
      const locationKey = getUUIDv4();
      setNavState(locationKey, allValues.location);

      router.push({
        pathname: "/map",
        params: {
          dataKey: locationKey
        }
      });
    }
  };

  const debouncedGetUserByUsername = useCallback(debounce(_getUserByUsername, 300), [errors?.username]);

  return (
    <>
      <AvatarSelection
        preSelectedAvatar={allValues.profilePic?.url}
        cb={(avatar) => {
          setValue("profilePic.url", avatar);
        }}
      />
      <InputGroup
        control={control}
        name="username"
        rules={{
          required: "Username is required",
          pattern: {
            value: /^[a-zA-Z][a-zA-Z0-9._]{4,19}$/,
            message:
              "Username must start with a letter, be 5-20 characters long, and can contain letters, numbers, dots, and underscores"
          }
        }}
        onChange={debouncedGetUserByUsername}
        iconAfter={
          (usernameLoading || isUsernameAvailable) &&
          allValues.username &&
          !errors.username && (
            <View
              items="flex-end"
              justify="center"
              animation={"quick"}
              enterStyle={{ opacity: 0, scale: 0.5 }}
              exitStyle={{ opacity: 0, scale: 0.5 }}
            >
              {usernameLoading && <Loader />}

              {!usernameLoading && isUsernameAvailable && (
                <CircleCheck
                  size={20}
                  color="$green10"
                />
              )}
            </View>
          )
        }
        placeHolder="Enter your username"
        label="Username"
        rightLabel="Required"
        error={errors.username}
      />

      <InputGroup
        control={control}
        name="_location"
        label="Location"
        placeHolder="Use your current location"
        rules={{ required: "Location is required" }}
        error={errors._location}
        containerProps={{
          onPress: askForLocation,
          cursor: "pointer"
        }}
        inputProps={{
          editable: false
        }}
        iconAfter={
          isLocationLoading ? (
            <Loader />
          ) : allValues._location ? (
            <Tooltip delay={200}>
              <Tooltip.Trigger>
                <SquareArrowOutUpRight
                  size={20}
                  onPress={handleEditLocation}
                />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <Text fontSize={"$2"}>Edit location</Text>
              </Tooltip.Content>
            </Tooltip>
          ) : (
            <MapPin size={20} />
          )
        }
      />
      <GenderSelection
        preSelectedGender={allValues.gender}
        cb={(gender) => {
          setValue("gender", gender);
        }}
      />
    </>
  );
};

export default ProfileSetup;
