import React, { useEffect, useState } from "react";

import { H4, H5, Image, Text, View, XStack, YStack } from "tamagui";
import { BackButtonHeader, IdentityCard } from "@/components/ui/common-components";
import { useLocalSearchParams } from "expo-router";
import { getEventById } from "@/common/api/events.action";
import { useToastController } from "@tamagui/toast";
import { useDataLoader } from "@/hooks";
import Loader from "@/components/ui/Loader";
import { Building, Crosshair, Landmark, MapPin, Navigation, Share, Share2 } from "@tamagui/lucide-icons";
import { EEventType } from "@/definitions/enums";
import ProfileAvatarPreview from "@/components/ui/ProfileAvatarPreview";
import { getStaticMapImageUrl } from "@/common/api/mapbox";
import { CardWrapper } from "./wrapper";
import { IAddress } from "@/definitions/types";
import { askForLocation, haversineDistanceInM } from "@/utils/location";
import * as Location from "expo-location";
import { formatDistance } from "@/helpers";

export const MapPreviewCard = (location: IAddress) => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const toastController = useToastController();

  useEffect(() => {
    const _func = async () => {
      await askForLocation(
        ({ coords }) => {
          setCurrentLocation(coords);
        },
        () => toastController.show("Permission denied for location")
      );
    };

    _func();
  }, []);
  const _getMapUrl = () => {
    if (location.latitude && location.longitude) {
      const staticMapUrl = getStaticMapImageUrl({
        latitude: location.latitude,
        longitude: location.longitude,
        markerConfig: {
          color: "fa0505",
          size: "l"
        },
        zoom: 15
      });
      return staticMapUrl;
    }
  };

  const staticMapURL = _getMapUrl();
  const distanceAway = currentLocation
    ? haversineDistanceInM(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: location.latitude, longitude: location.longitude }
      )
    : "-";

  return (
    <CardWrapper
      display="flex"
      flexDirection="column"
      gap={"$4"}
      items="center"
      width={"100%"}
    >
      <XStack
        gap={"$2"}
        items="center"
        justify="flex-start"
        width={"100%"}
      >
        <MapPin
          size={16}
          color={"$color10"}
        />
        <Text
          fontSize={"$5"}
          numberOfLines={1}
          textOverflow="ellipsis"
        >{`${location.street}, ${location.city}, ${location.state} ${location.postcode}`}</Text>
      </XStack>

      <XStack
        gap={"$4"}
        flex={1}
        justify="flex-start"
        width={"100%"}
      >
        <Image
          source={{ uri: staticMapURL }}
          width={130}
          height={130}
          rounded={"$4"}
          hoverStyle={{
            scale: 1.05
          }}
        />
        <YStack
          flex={1}
          gap={"$2"}
          justify={"flex-start"}
          height={"100%"}
        >
          <Text fontSize={"$4"}>{location.address}</Text>

          {location.building && (
            <XStack
              gap={"$2"}
              items="center"
            >
              <Building
                size={16}
                color={"$color10"}
              />
              <Text>{location.building}</Text>
            </XStack>
          )}
          {location.landmark && (
            <XStack
              gap={"$2"}
              items="center"
            >
              <Landmark
                size={16}
                color={"$color10"}
              />
              <Text fontSize={"$3"}>{location.landmark}</Text>
            </XStack>
          )}
          <XStack
            gap={"$2"}
            items="center"
          >
            <Crosshair
              size={16}
              color={"$color10"}
            />
            <Text
              color={"$color10"}
              fontSize={"$2"}
            >
              {location.latitude}, {location.longitude}
            </Text>
          </XStack>

          <XStack
            gap={"$2"}
            items="center"
          >
            <Navigation
              size={16}
              color={"$color10"}
            />

            <Text
              color={"$color10"}
              fontSize={"$2"}
            >
              {distanceAway !== "-" ? formatDistance(distanceAway) : distanceAway} away
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </CardWrapper>
  );
};

const EventDetails: React.FC = () => {
  const { id } = useLocalSearchParams();
  const toastController = useToastController();

  const { data: eventData, loading } = useDataLoader(fetchEventData);

  async function fetchEventData() {
    try {
      const response = await getEventById(id as string);

      return response.data;
    } catch (error: any) {
      toastController.show(error?.message ?? "Something went wrong");
    }
  }

  const createdBy = eventData?.event?.creator;
  const isOrganized = eventData?.event?.type === EEventType.Organized;

  return (
    <YStack
      p={"$4"}
      gap={"$4"}
    >
      <BackButtonHeader
        title={eventData?.event?.name ?? "Event Details"}
        navigateTo="/home"
      >
        <View
          bg={"$color4"}
          rounded={"$4"}
          items={"center"}
          justify={"center"}
          cursor={"pointer"}
          height={"100%"}
        >
          <Share2
            size={24}
            color={"$accent1"}
            cursor={"pointer"}
          />
        </View>
      </BackButtonHeader>
      <YStack
        gap={"$4"}
        mt={"$4"}
        flex={1}
      >
        {loading && <Loader />}
        {eventData && (
          <YStack
            gap={"$4"}
            flex={1}
          >
            <H4>{eventData.event.name}</H4>
            {createdBy && (
              <ProfileAvatarPreview user={createdBy}>
                <IdentityCard
                  imageUrl={createdBy?.profilePic?.url || ""}
                  title={(isOrganized ? "Organized by" : "Hosted by") + " " + createdBy?.name}
                  subtitle={createdBy?.username ? `@${createdBy.username}` : ""}
                  imageAlt={createdBy?.name}
                />
              </ProfileAvatarPreview>
            )}
            <MapPreviewCard {...eventData.event.location} />
          </YStack>
        )}
      </YStack>
    </YStack>
  );
};

export default EventDetails;
