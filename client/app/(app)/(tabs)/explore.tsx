import CustomAvatar from "@/components/CustomAvatar";
import HorizontalTabs from "@/components/CustomTabs";
import { InputGroup } from "@/components/Form";
import PulsatingDot from "@/components/PulsatingDot";
import { Badge } from "@/components/ui/Badge";
import { OutlineButton } from "@/components/ui/Buttons";
import { IdentityCard, TagListing, UserCluster } from "@/components/ui/common-components";
import { CardWrapper, CircleBgWrapper } from "@/components/ui/common-styles";
import { SpinningLoader } from "@/components/ui/Loaders";
import { PLATFORM_SOCKET_EVENTS } from "@/constants/global";
import { useSocket } from "@/contexts/Socket";
import { IAddress, IBaseUser, ITag } from "@/definitions/types";
import { formatDistance } from "@/helpers";
import { isEmpty, kebabCase, startCase } from "@/utils";
import { formatDateWithTimeString } from "@/utils/date.utils";
import { askForLocation, haversineDistanceInM } from "@/utils/location";
import {
  ArrowRight,
  Clapperboard,
  CloudSun,
  Flame,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  RotateCcw,
  Search,
  Sun,
  Users
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { LocationObjectCoords } from "expo-location";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { H6, Image, ScrollView, Text, View, XStack, YStack } from "tamagui";
import ExploreAssetPreview from "@/components/ExploreAssetPreview";

export enum EExploreComponents {
  TasteCalendar = "taste-calendar",
  FoodieFeed = "foodie-feed",
  Reels = "reels",
  Collaborations = "collaborations",
  Trending = "trending"
}

interface BasePayload {
  id: string;
  title: string;
  media: {
    type: string;
    url: string;
    thumbnailUrl: string;
  };
  location: IAddress;
  startTime: string;
  endTime: string;
  tags: ITag[];
  creator: IBaseUser;
  createdAt: string;
  status: string;
}

interface ITasteCalendarPayload extends BasePayload {
  filter: string[];
}

type IFoodieFeedPayload = BasePayload[];

interface IReelsPayload extends BasePayload {
  likes: number;
  comments: number;
  user: IBaseUser;
}

interface ICollaborationsPayload extends BasePayload {
  chef: string;
  time: string;
  going: number;
  verifiers: {
    user: IBaseUser;
    verifiedAt: string;
  }[];
}

interface ITrendingPayload extends BasePayload {
  going: number;
  verifiers: {
    user: IBaseUser;
    verifiedAt: string;
  }[];
}

interface IExploreSection {
  component: EExploreComponents;
  title: string;
  subtitle: string;
  payload: ITasteCalendarPayload | IFoodieFeedPayload | IReelsPayload | ICollaborationsPayload | ITrendingPayload;
}

const EventCard = ({ event, width = 140, children }: { event: any; width?: number; children?: React.ReactNode }) => {
  const startTime = event.startTime
    ? new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const endTime = event.endTime
    ? new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <CardWrapper
      width={width}
      rounded="$4"
      overflow="hidden"
      p={0}
      cursor="pointer"
      position="relative"
    >
      <YStack
        height={100}
        bg="$color10"
      >
        <Image
          source={{ uri: event.image }}
          style={{ width: "100%", height: "100%" }}
          objectFit="cover"
        />
        <YStack
          position="absolute"
          b={0}
          l={0}
          r={0}
          p="$2"
        >
          <Text
            color="white"
            fontSize={"$1"}
          >
            {startTime} - {endTime}
          </Text>
        </YStack>
      </YStack>
      <YStack p="$2">
        <Text
          fontSize="$2"
          fontWeight="500"
          ellipsizeMode="tail"
          textOverflow="ellipsis"
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <XStack
          items="center"
          gap="$1"
          mt="$1"
        >
          <MapPin size={12} />
          <Text
            fontSize={"$1"}
            color="$color10"
            ellipsizeMode="tail"
          >
            {event.location?.city} | {event.location?.country}
          </Text>
        </XStack>
      </YStack>
      {children}
    </CardWrapper>
  );
};

const CommonHeader = ({
  heading,
  subHeading,
  handleSeeAllPress
}: {
  heading: string;
  subHeading: string;
  handleSeeAllPress: () => void;
}) => {
  return (
    <XStack
      gap={"$4"}
      items={"flex-start"}
      justify={"space-between"}
      width={"100%"}
    >
      <YStack gap={"$1"}>
        <H6>{heading}</H6>
        <Text
          fontSize={"$2"}
          color={"$color10"}
        >
          {subHeading}
        </Text>
      </YStack>

      <XStack
        onPress={handleSeeAllPress}
        group
        gap={"$1"}
        items={"center"}
        flex={1}
        justify={"flex-end"}
      >
        <Text
          fontSize={"$3"}
          cursor="pointer"
        >
          See all
        </Text>
        <ArrowRight
          cursor="pointer"
          size={16}
          animation={"quick"}
          $group-hover={{
            transform: [{ translateX: 2 }]
          }}
        />
      </XStack>
    </XStack>
  );
};

const TasteCalendar = ({ payload, filters, userLocation }: { payload: ITasteCalendarPayload[]; filters: string[]; userLocation: LocationObjectCoords | null }) => {
  const iconMapping = {
    morning: <Sun size={16} />,
    evening: <CloudSun size={16} />,
    night: <Moon size={16} />
  };

  const renderTabContent = (filter: string) => {
    const filteredPayload = payload.filter((item) => item.filter.includes(filter));

    if (isEmpty(filteredPayload)) {
      return (
        <YStack
          height={150}
          justify={"center"}
          items={"center"}
          width={"100%"}
          flex={1}
        >
          <Text>No events found</Text>
        </YStack>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <XStack
          gap={"$2"}
          flexDirection="row"
        >
          {filteredPayload.map((item) => (
            <View key={item.id} width={140}>
              <ExploreAssetPreview
                media={item.media}
                title={item.title}
                location={item.location}
                creator={item.creator}
                createdAt={item.createdAt}
                startTime={item.startTime}
                endTime={item.endTime}
                userLocation={userLocation}
                tags={item.tags}
                showPreviewButton={true}
                previewButtonText="View"
              />
            </View>
          ))}
        </XStack>
      </ScrollView>
    );
  };

  const tabs = filters.map((filter) => ({
    label: startCase(filter),
    icon: iconMapping[filter as keyof typeof iconMapping],
    content: renderTabContent(filter)
  }));

  return (
    <XStack
      justify={"center"}
      flex={1}
    >
      <HorizontalTabs
        tabs={tabs}
        defaultValue={kebabCase(tabs[0].label)}
      />
    </XStack>
  );
};

const FoodieFeed = ({
  payload,
  userLocation
}: {
  payload: IFoodieFeedPayload;
  userLocation: LocationObjectCoords | null;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <XStack gap={"$4"}>
        {payload.map((item) => (
          <View key={item.id} width={150}>
            <ExploreAssetPreview
              media={item.media}
              title={item.title}
              location={item.location}
              creator={item.creator}
              createdAt={item.createdAt}
              startTime={item.startTime}
              endTime={item.endTime}
              userLocation={userLocation}
              tags={item.tags}
              showPreviewButton={true}
              previewButtonText="Live"
            />
          </View>
        ))}
      </XStack>
    </ScrollView>
  );
};

const Reels = ({ payload, userLocation }: { payload: IReelsPayload[]; userLocation: LocationObjectCoords | null }) => {
  return (
    <ScrollView>
      <XStack gap={"$4"}>
        {payload.map((item) => (
          <View key={item.id} width={160}>
            <ExploreAssetPreview
              media={item.media}
              title={item.title}
              location={item.location}
              creator={item.user}
              createdAt={item.createdAt}
              likes={item.likes}
              comments={item.comments}
              userLocation={userLocation}
              tags={item.tags}
              showPreviewButton={true}
              previewButtonText="Watch"
            />
          </View>
        ))}
      </XStack>
    </ScrollView>
  );
};

const Collaborations = ({
  payload,
  userLocation
}: {
  payload: ICollaborationsPayload[];
  userLocation: LocationObjectCoords | null;
}) => {
  return (
    <ScrollView>
      <YStack gap={"$4"}>
        {payload.map((item) => (
          <View key={item.id}>
            <ExploreAssetPreview
              media={item.media}
              title={item.title}
              location={item.location}
              creator={item.creator}
              createdAt={item.createdAt}
              startTime={item.startTime}
              endTime={item.endTime}
              going={item.going}
              userLocation={userLocation}
              tags={item.tags}
              showPreviewButton={true}
              previewButtonText="View Event"
            />
          </View>
        ))}
      </YStack>
    </ScrollView>
  );
};

const Trending = ({ payload, userLocation }: { payload: ITrendingPayload[]; userLocation: LocationObjectCoords | null }) => {
  return (
    <ScrollView>
      <XStack gap={"$4"}>
        {payload.map((item) => (
          <View key={item.id} width={180}>
            <ExploreAssetPreview
              media={item.media}
              title={item.title}
              location={item.location}
              creator={item.creator}
              createdAt={item.createdAt}
              startTime={item.startTime}
              endTime={item.endTime}
              going={item.going}
              userLocation={userLocation}
              tags={item.tags}
              showPreviewButton={true}
              previewButtonText="Trending"
            />
          </View>
        ))}
      </XStack>
    </ScrollView>
  );
};

const mapping = {
  [EExploreComponents.TasteCalendar]: {
    title: "Taste Calendar",
    subtitle: "Discover food events by time of day",
    component: TasteCalendar,
    filters: ["morning", "evening", "night"]
  },
  [EExploreComponents.FoodieFeed]: {
    title: "Foodie Feed",
    subtitle: "Live events happening now",
    component: FoodieFeed
  },
  [EExploreComponents.Reels]: {
    title: "Food Reels",
    subtitle: "Watch latest event highlights",
    component: Reels
  },
  [EExploreComponents.Collaborations]: {
    title: "Collaborations",
    subtitle: "Special events with chefs & influencers",
    component: Collaborations
  },
  [EExploreComponents.Trending]: {
    title: "Trending",
    subtitle: "Popular events in your area",
    component: Trending
  }
};

const explore = () => {
  const {
    control,
    formState: { errors }
  } = useForm({});

  const socket = useSocket();

  const handleFilterPress = () => {
    console.log("filter pressed");
  };

  const [currentUserLocation, setCurrentUserLocation] = useState<LocationObjectCoords | null>(null);
  const toastController = useToastController();
  const [sections, setSections] = useState<IExploreSection[]>([]);

  useEffect(() => {
    handleLocationAccess();
  }, []);

  useEffect(() => {
    if (!currentUserLocation) return;

    socket.emit(PLATFORM_SOCKET_EVENTS.EXPLORE, {
      filter: {
        location: {
          latitude: currentUserLocation?.latitude,
          longitude: currentUserLocation?.longitude
        }
      }
    });

    socket.on(PLATFORM_SOCKET_EVENTS.EXPLORE, ({ data, error }) => {
      console.log("data", data);
      if (error) {
        toastController.show(error);
      } else {
        setSections((prev) => [...prev, data]);
      }
    });
  }, [!!currentUserLocation, socket]);

  function handleLocationAccess() {
    askForLocation().then((location) => {
      if (location) {
        setCurrentUserLocation(location.coords);
      } else {
        toastController.show("Failed to get your location");
      }
    });
  }

  if (!currentUserLocation) {
    return (
      <YStack
        flex={1}
        justify={"center"}
        items={"center"}
        gap={"$4"}
      >
        <Text
          maxW={400}
          text={"center"}
        >
          Oh no! We need your location to create your personalized feed.
        </Text>
        <OutlineButton
          onPress={handleLocationAccess}
          icon={<RotateCcw size={16} />}
        >
          <Text>Allow location access</Text>
        </OutlineButton>
      </YStack>
    );
  }

  return (
    <YStack
      gap={"$4"}
      p={"$4"}
      width={"100%"}
      flex={1}
    >
      <InputGroup
        control={control}
        name="search"
        // label="Search"
        placeHolder="Search for an event"
        error={errors.search?.message}
        iconBefore={<Search size={16} />}
        iconAfter={
          <Menu
            size={16}
            cursor="pointer"
            onPress={handleFilterPress}
          />
        }
      />

      {!sections.length ? (
        <YStack
          flex={1}
          justify={"center"}
          items={"center"}
        >
          <SpinningLoader />
        </YStack>
      ) : (
        <ScrollView flex={1}>
          <YStack gap={"$5"}>
            {sections.map((section) => {
              if (section.component in mapping) {
                const Component = mapping[section.component].component;
                return (
                  <YStack gap={"$3"}>
                    <CommonHeader
                      heading={section.title}
                      subHeading={section.subtitle}
                      handleSeeAllPress={() => {}}
                    />
                    <Component
                      payload={section.payload as any}
                      userLocation={currentUserLocation}
                      filters={(mapping[section.component] as any)?.filters || []}
                    />
                  </YStack>
                );
              }
              return null;
            })}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  );
};

export default explore;
