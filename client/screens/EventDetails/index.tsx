import React, { useEffect, useState } from "react";

import { getEventById } from "@/common/api/events.action";
import { getStaticMapImageUrl } from "@/common/api/mapbox";
import { FilledButton } from "@/components/ui/Buttons";
import {
  BackButtonHeader,
  IdentityCard,
  TagListing,
  TagPreviewTooltip,
  UserCluster
} from "@/components/ui/common-components";
import { Badge, CardWrapper, CircleBgWrapper } from "@/components/ui/common-styles";
import Loader from "@/components/ui/Loader";
import ProfileAvatarPreview from "@/components/ui/ProfileAvatarPreview";
import { EEventType } from "@/definitions/enums";
import { IAddress, IBaseUser } from "@/definitions/types";
import { formatDistance } from "@/helpers";
import { useDataLoader } from "@/hooks";
import { askForLocation, haversineDistanceInM } from "@/utils/location";
import { Building, Compass, Crosshair, Landmark, MapPin, Navigation, Share2 } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";
import { H4, H5, H6, Image, ScrollView, Text, View, XStack, YStack } from "tamagui";
import { formatDateToLongString } from "@/utils/date.utils";

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
        <CircleBgWrapper size={"$2"}>
          <MapPin
            size={16}
            color={"$color10"}
          />
        </CircleBgWrapper>
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
          <FilledButton
            rounded={"$4"}
            width={"min-content"}
            onPress={() => {
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
              );
            }}
            size={"small"}
            icon={<Compass size={16} />}
          >
            Get Directions
          </FilledButton>
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

  const _event = eventData?.event;

  const createdBy = _event?.creator;
  const isOrganized = _event?.type === EEventType.Organized;
  const tags = _event?.tags;
  const participants = _event?.participants;

  return (
    <YStack
      p={"$4"}
      gap={"$4"}
      height={"100%"}
      overflow="hidden"
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
      <ScrollView
        gap={"$4"}
        mt={"$4"}
        flex={1}
        showsVerticalScrollIndicator={false}
        width={"100%"}
        $gtMd={{ items: "center" }}
      >
        {loading && <Loader />}
        {eventData && (
          <YStack
            gap={"$4"}
            flex={1}
            $gtMd={{ maxW: 600 }}
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
            <CardWrapper gap={"$2"}>
              <H6>Tags</H6>
              <TagListing tags={tags || []} />
            </CardWrapper>

            {!!participants?.length && (
              <CardWrapper gap={"$2"}>
                <XStack
                  items={"center"}
                  justify={"space-between"}
                  gap={"$4"}
                >
                  <H6>Attendees</H6>
                  {_event?.capacity && (
                    <Badge outline-success={true}>
                      <Text
                        fontSize={"$2"}
                        color={"$green11"}
                      >
                        {participants.length}/{_event.capacity}
                      </Text>
                    </Badge>
                  )}
                </XStack>
                <UserCluster
                  users={participants.map((p) => p.user as IBaseUser)}
                  maxLimit={6}
                />
              </CardWrapper>
            )}

            {!!_event?.verifiers.length && (
              <CardWrapper gap={"$2"}>
                <H6>Verifiers</H6>
                {_event.verifiers.map((_verifier) => {
                  const { user, verifiedAt } = _verifier;
                  return (
                    <XStack
                      gap={"$4"}
                      justify={"space-between"}
                    >
                      <IdentityCard
                        imageUrl={(user as IBaseUser).profilePic?.url || ""}
                        title={(user as IBaseUser).name}
                        subtitle={(user as IBaseUser).username ? `@${(user as IBaseUser).username}` : ""}
                      />
                      <Badge outline-success>
                        <Text
                          fontSize={"$2"}
                          color={"$green11"}
                        >
                          Verified on {formatDateToLongString(verifiedAt)}
                        </Text>
                      </Badge>
                    </XStack>
                  );
                })}
              </CardWrapper>
            )}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
};

export default EventDetails;
