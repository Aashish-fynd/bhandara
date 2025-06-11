import React, { memo, useEffect, useRef, useState } from "react";

import { getEventById } from "@/common/api/events.action";
import { getStaticMapImageUrl } from "@/common/api/mapbox";
import { FilledButton } from "@/components/ui/Buttons";
import { BackButtonHeader, IdentityCard, TagListing, UserCluster } from "@/components/ui/common-components";
import { Badge, CardWrapper, CircleBgWrapper } from "@/components/ui/common-styles";
import Loader from "@/components/ui/Loader";
import ProfileAvatarPreview from "@/components/ui/ProfileAvatarPreview";
import { EEventType, EThreadType } from "@/definitions/enums";
import { IAddress, IBaseThread, IBaseUser, IEvent, IMessage } from "@/definitions/types";
import { formatDistance } from "@/helpers";
import { useDataLoader } from "@/hooks";
import { askForLocation, haversineDistanceInM } from "@/utils/location";
import {
  Building,
  ChevronRight,
  Compass,
  Crosshair,
  Landmark,
  MapPin,
  Navigation,
  Share2
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";
import { H4, H6, Image, ScrollView, Sheet, TamaguiElement, Text, View, XStack, YStack, YStackProps } from "tamagui";
import { formatDateWithTimeString } from "@/utils/date.utils";
import { getThreadById } from "@/common/api/threads.action";
import { omit, startCase } from "@/utils";

import { format } from "date-fns";
import CustomAvatar from "@/components/CustomAvatar";
import { getChildMessagesForThread, getMessageById, getMessagesForThread } from "@/common/api/messages.action";

interface ThreadCardProps {
  thread: { id: string };
  message: IMessage;
  handleClick: (data: Record<string, any>) => void;
}

export function MessageCard({ thread, message, handleClick }: ThreadCardProps) {
  const userProfileUrl = message?.user?.profilePic?.url || "";
  const userName = message?.user?.name || "";
  const childMessages = message?.children;

  const childMessagesUser = (childMessages || []).map((ch) => ch.user).filter((i) => !!i);

  const maxRepliesUserToShow = 3;
  const userForCluster = childMessagesUser.slice(0, maxRepliesUserToShow);

  const lineRef = useRef<TamaguiElement>(null);

  const remainingUserReplies = childMessagesUser.length - maxRepliesUserToShow;

  return (
    <XStack
      gap="$3"
      items="flex-start"
      position="relative"
      onLayout={(e) => {
        const { nativeEvent } = e;
        if (lineRef.current) {
          // @ts-ignore
          lineRef.current.style.height = `${nativeEvent.layout.height - (56 + 5)}px`;
        }
      }}
    >
      <CustomAvatar
        src={userProfileUrl}
        alt={userName}
      />
      <YStack
        gap="$1"
        flex={1}
        position="unset"
      >
        <XStack
          gap="$2"
          items="center"
          justify={"flex-start"}
        >
          <Text fontSize={"$4"}>{userName}</Text>
          <Text
            color="$color10"
            fontWeight={"100"}
            fontSize="$1"
          >
            {format(new Date(message?.createdAt), "hh:mm a")}
          </Text>
        </XStack>
        <Text
          fontSize={"$3"}
          color="$color11"
        >
          {message.content.text}
        </Text>

        {!!childMessages?.length && (
          <>
            <CardWrapper
              gap={"$3.5"}
              mt={"$2"}
              flexDirection="row"
              width={"auto"}
              p={0}
              self={"flex-start"}
              items={"center"}
              rounded={0}
              borderColor={"transparent"}
              cursor="pointer"
              onPress={() => handleClick({ parentId: message.id, threadId: thread.id })}
            >
              <UserCluster users={userForCluster as IBaseUser[]} />
              <Text
                fontWeight="600"
                color="$blue10"
              >
                {childMessages?.length}
              </Text>
              <Text
                fontSize={"$3"}
                borderBottomWidth={"$0.5"}
                borderColor={"transparent"}
                hoverStyle={{ borderColor: "$color12" }}
                transition="border .2s ease-in"
              >
                {remainingUserReplies > 0 ? `+${remainingUserReplies} Replies` : "View Thread"}
              </Text>
            </CardWrapper>

            <View
              position="absolute"
              borderColor={"$color8"}
              borderLeftWidth={"$1"}
              borderBottomWidth={"$1"}
              width={28}
              b={15}
              l={20}
              z={1}
              borderBottomLeftRadius={"$4"}
              ref={lineRef}
            />
          </>
        )}
      </YStack>
    </XStack>
  );
}

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

export const VerifiersListing = ({ verifiers }: { verifiers: IEvent["verifiers"] }) => {
  // sort the latest ones first
  const _verifiers = Object.values(verifiers).sort(
    (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
  );

  return (
    <CardWrapper gap={"$3"}>
      <H6>Verifiers</H6>
      {_verifiers.map((_verifier, index) => {
        const { user, verifiedAt } = _verifier;
        return (
          <XStack
            gap={"$4"}
            justify={"space-between"}
            key={verifiedAt.toString() + index}
          >
            <ProfileAvatarPreview
              user={user as IBaseUser}
              extraMeta={
                <>
                  <Text fontSize={"$2"}>Verified at</Text>
                  <Text
                    fontSize={"$2"}
                    color={"$color11"}
                  >
                    {formatDateWithTimeString(verifiedAt)}
                  </Text>
                </>
              }
            >
              <IdentityCard
                imageUrl={(user as IBaseUser).profilePic?.url || ""}
                title={(user as IBaseUser).name}
                subtitle={(user as IBaseUser).username ? `@${(user as IBaseUser).username}` : ""}
              />
            </ProfileAvatarPreview>
            <Badge outline-success>
              <Text
                fontSize={"$2"}
                color={"$green11"}
              >
                Verified
              </Text>
            </Badge>
          </XStack>
        );
      })}
    </CardWrapper>
  );
};

enum ViewTypes {
  Thread = "thread",
  ChildMessages = "child",
  Message = "message",
  None = 0
}

type BaseCommonProps = {
  threadId?: string;
  parentId?: string;
  messageId?: string;
};

interface IProps extends BaseCommonProps {
  onBack: () => void;
  style: YStackProps["style"];
  handleClick: (data: BaseCommonProps) => void;
}

const MessageView = memo(({ threadId, parentId, messageId, onBack, handleClick, style }: IProps) => {
  const headers = {
    [ViewTypes.Thread]: "Thread",
    [ViewTypes.Message]: "Message",
    [ViewTypes.ChildMessages]: "Messages",
    [ViewTypes.None]: ""
  };

  const methodExecutors = {
    [ViewTypes.Thread]: () => getMessagesForThread({ threadId: threadId || "" }),
    [ViewTypes.Message]: () => getMessageById({ messageId: messageId || "", threadId: threadId || "" }),
    [ViewTypes.ChildMessages]: () => getChildMessagesForThread({ threadId: threadId || "", parentId: parentId || "" }),
    [ViewTypes.None]: () => {}
  };

  const determineViewType = ({ threadId, parentId, messageId }: BaseCommonProps) => {
    if (parentId && threadId) return ViewTypes.ChildMessages;
    if (threadId && messageId) return ViewTypes.Message;
    if (threadId) return ViewTypes.Thread;
    return ViewTypes.None;
  };

  const currentView = determineViewType({ threadId, parentId, messageId });

  async function methodExecutor(currentView: ViewTypes) {
    return await methodExecutors[currentView]();
  }

  const getFormattedData = (data: any) => {
    if (currentView === ViewTypes.ChildMessages) return data || [];
    if (currentView == ViewTypes.Message) return data;
    if (currentView === ViewTypes.Thread) return data?.items || [];
  };

  const { data, loading } = useDataLoader({ promiseFunction: () => methodExecutor(currentView) });

  const _fetchedData = getFormattedData(data?.data);

  return (
    <YStack
      gap={"$4"}
      width={"100%"}
      flex={1}
      style={style}
      p={"$4"}
    >
      <BackButtonHeader
        title={headers[currentView]}
        arrowCb={onBack}
      />
      {loading ? (
        <View
          items={"center"}
          justify={"center"}
          height={"100%"}
          width={"100%"}
        >
          <Loader />
        </View>
      ) : (
        _fetchedData && (
          <ScrollView width={"100%"}>
            <YStack
              flex={1}
              gap={"$4"}
            >
              {_fetchedData?.map((i: IMessage) => (
                <MessageCard
                  thread={{ id: threadId || "" }}
                  message={i}
                  handleClick={handleClick}
                  key={i.id}
                />
              ))}
            </YStack>
          </ScrollView>
        )
      )}
    </YStack>
  );
});

const EventDetails: React.FC = () => {
  const { id } = useLocalSearchParams();
  const toastController = useToastController();

  const { data: _event, loading } = useDataLoader({ promiseFunction: fetchEventData });
  const { data: _threads, loading: threadsLoading } = useDataLoader({
    promiseFunction: getThreadsData,
    enabled: !!_event
  });

  async function fetchEventData() {
    try {
      const response = await getEventById(id as string);

      return response.data;
    } catch (error: any) {
      toastController.show(error?.message ?? "Something went wrong");
    }
  }

  async function getThreadsData() {
    const threadsIds = Object.values(_event?.threads || {});
    const threadsResponse = await Promise.all<{ data: IBaseThread | null; error: Record<string, any> }>(
      threadsIds.map((id) => getThreadById({ id }))
    );
    const filteredResponse = threadsResponse.map((t) => t.data).filter(Boolean);
    const _returnObj = filteredResponse.reduce(
      (acc, cur) => {
        if (cur) acc[cur.type] = cur;
        return acc;
      },
      {} as Record<EThreadType, IBaseThread>
    );

    return _returnObj;
  }

  const createdBy = _event?.creator;
  const isOrganized = _event?.type === EEventType.Organized;
  const tags = _event?.tags;
  const participants = _event?.participants;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetStack, setSheetStack] = useState<Array<BaseCommonProps>>([]);

  const handleClick = ({
    messageId,
    threadId,
    parentId
  }: {
    messageId?: string;
    threadId?: string;
    parentId?: string;
  }) => {
    if (messageId || threadId || parentId) {
      setSheetStack((prev) => [...prev, { parentId, threadId, messageId }]);
      setIsSheetOpen(true);
    }
  };

  const handleSheetBack = () => {
    if (sheetStack.length > 1) {
      setSheetStack((prev) => prev.slice(0, -1));
    } else {
      setSheetStack([]);
      setIsSheetOpen(false);
    }
  };

  return (
    <>
      <YStack
        p={"$4"}
        gap={"$4"}
        height={"100%"}
        overflow="hidden"
      >
        <BackButtonHeader
          title={_event?.name ?? "Event Details"}
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
          flex={1}
          showsVerticalScrollIndicator={false}
          width={"100%"}
          $gtMd={{ items: "center" }}
        >
          {loading ? (
            <Loader />
          ) : (
            _event && (
              <YStack
                gap={"$4"}
                flex={1}
                $gtMd={{ maxW: 600 }}
              >
                <H4>{_event.name}</H4>
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
                <MapPreviewCard {..._event.location} />
                <CardWrapper>
                  <H6>Tags</H6>
                  <TagListing tags={tags || []} />
                </CardWrapper>

                {!!participants?.length && (
                  <CardWrapper>
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

                {!!_event?.verifiers.length && <VerifiersListing verifiers={_event.verifiers} />}

                {[EThreadType.Discussion, EThreadType.QnA].map((threadType) => {
                  const thread = _threads?.[threadType];
                  return (
                    (threadsLoading || thread) && (
                      <CardWrapper key={threadType}>
                        <XStack
                          gap={"$4"}
                          justify={"space-between"}
                        >
                          <H6>{startCase(threadType)}</H6>
                          <ChevronRight
                            size={20}
                            color={"$color"}
                            cursor="pointer"
                            onPress={() => {
                              handleClick({ threadId: thread?.id });
                            }}
                          />
                        </XStack>
                        {threadsLoading ? (
                          <Loader />
                        ) : (
                          thread &&
                          !!thread.messages?.length && (
                            <MessageCard
                              thread={omit(thread, ["messages"])}
                              handleClick={handleClick}
                              message={thread.messages[0]}
                            />
                          )
                        )}
                      </CardWrapper>
                    )
                  );
                })}
              </YStack>
            )
          )}
        </ScrollView>
      </YStack>

      <Sheet
        modal={true}
        defaultOpen={false}
        open={isSheetOpen}
        zIndex={20}
        animation={"quick"}
        dismissOnOverlayPress={false}
        dismissOnSnapToBottom={false}
        snapPoints={[80]}
        defaultPosition={0}
        snapPointsMode="percent"
        unmountChildrenWhenHidden
      >
        <Sheet.Overlay
          shadowColor={"$black1"}
          opacity={0.7}
          z={10}
        />
        <Sheet.Handle bg={"$color4"} />
        <Sheet.Frame
          p="$4"
          py={"$6"}
          justify="flex-start"
          items="center"
          gap="$5"
          bg={"$accent12"}
          mx={"auto"}
        >
          {sheetStack.map((sheetData, index) => (
            <MessageView
              key={`${sheetData.threadId}-${sheetData.parentId}-${sheetData.messageId}-${index}`}
              {...sheetData}
              onBack={handleSheetBack}
              handleClick={handleClick}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: index,
                display: index === sheetStack.length - 1 ? "flex" : "none"
              }}
            />
          ))}
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default EventDetails;
