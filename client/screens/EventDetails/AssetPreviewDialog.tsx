import CustomAvatar from "@/components/CustomAvatar";
import { CardWrapper, CircleBgWrapper } from "@/components/ui/common-styles";
import { EMediaType } from "@/definitions/enums";
import { IBaseUser, IMedia } from "@/definitions/types";
import { formatTimeAgo } from "@/utils/date.utils";
import {
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  ExternalLink,
  Minus,
  Plus,
  RefreshCcw,
  RefreshCw,
  RotateCw,
  X
} from "@tamagui/lucide-icons";
import React, { useRef, useState } from "react";
import { AnimatePresence, Image, Slider, styled, Text, View, XStack, YStack } from "tamagui";
import Video, { VideoRef } from "react-native-video";
import { ZoomableImage } from "./ZoomableImage";
import { useAuth } from "@/contexts/AuthContext";
import { isEmpty } from "@/utils";

interface Props {
  medias: (IMedia & { user?: IBaseUser })[];
  currentSelectedMediaId?: string;
  close: () => void;
}

const IconWrapperCard = styled(CardWrapper, {
  p: "$2",
  rounded: "$2",
  width: "auto",
  cursor: "pointer",
  flexDirection: "row"
});

const GalleryItem = styled(View, {
  width: 500,
  height: 300,
  position: "absolute",
  overflow: "hidden",
  z: 1,
  x: 0,
  opacity: 1,
  variants: {
    going: {
      ":number": (going) => ({
        enterStyle: {
          x: going > 0 ? 500 : -500,
          opacity: 0
        },
        exitStyle: {
          zIndex: 0,
          x: going < 0 ? 500 : -500,
          opacity: 0
        }
      })
    }
  } as const
});

const STEP_VALUE = 20;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const AssetPreviewDialog = ({ medias, currentSelectedMediaId, close }: Props) => {
  const { user: currentAuthenticatedUser } = useAuth();
  const [[mediaIndex, going], setMediaIndex] = useState(() => {
    const index = medias.findIndex((f) => f.id === currentSelectedMediaId);
    if (index !== -1) return [index, 0];
    else return [0, 0];
  });

  const currentSelectedMedia = medias[mediaIndex];

  const videoRef = useRef<VideoRef>(null);

  const timeAgo = formatTimeAgo(currentSelectedMedia.createdAt);
  const [zoomValue, setZoomValue] = useState(0);
  const mediaUser = currentSelectedMedia.user;

  const paginate = (going: number) => {
    setMediaIndex([mediaIndex + going, going]);
  };

  const isLeftButtonDisabled = mediaIndex === 0;
  const isRightButtonDisabled = mediaIndex === medias.length - 1;

  return (
    <YStack gap={"$4"}>
      <XStack
        gap={"$2"}
        flex={1}
        justify={"space-between"}
        items={"flex-start"}
      >
        {!isEmpty(mediaUser) && (
          <XStack
            gap={"$2"}
            flex={1}
          >
            <CustomAvatar
              src={mediaUser?.media?.publicUrl || ""}
              alt={mediaUser?.name || ""}
              size={32}
            />
            <YStack>
              <Text fontSize={"$4"}>{mediaUser?.id === currentAuthenticatedUser?.id ? "You" : mediaUser?.name}</Text>
              <Text
                fontSize={"$2"}
                color={"$color10"}
                overflow="hidden"
                ellipse
              >
                {`${timeAgo} - ${currentSelectedMedia?.name}`}
              </Text>
            </YStack>
          </XStack>
        )}
        <X
          color={"$color12"}
          size={20}
          cursor="pointer"
          onPress={close}
        />
      </XStack>
      <View
        position="relative"
        height={300}
        width={500}
        group
      >
        <AnimatePresence
          initial={false}
          custom={{ going }}
        >
          <GalleryItem
            key={mediaIndex}
            animation="quicker"
            going={going}
          >
            {currentSelectedMedia.type === EMediaType.Image && (
              <ZoomableImage
                uri={currentSelectedMedia?.publicUrl || ""}
                containerStyle={{ width: 500, height: 300, rounded: "$2" }}
                scale={zoomValue / 10 === 0 ? 1 : zoomValue / 10}
              />
            )}
            {currentSelectedMedia.type === EMediaType.Video && (
              <Video
                // Can be a URL or a local file.
                source={{ uri: currentSelectedMedia?.publicUrl }}
                // Store reference
                ref={videoRef}
                style={{
                  width: 500,
                  position: "relative",
                  height: 300
                }}
                controls
                paused
              />
            )}
          </GalleryItem>
        </AnimatePresence>

        {/* navigation button */}
        <CircleBgWrapper
          bg={"$accent11"}
          p={"$2"}
          t={300 / 2 - 19} // button wrapper size 38/2 = 19
          l={0}
          position="absolute"
          hoverStyle={{ x: -5, bg: "$accent10" }}
          $group-hover={{ display: isLeftButtonDisabled ? "none" : "flex" }}
          animation={"medium"}
          cursor={"pointer"}
          onPress={() => paginate(-1)}
          z={10}
        >
          <ChevronLeft />
        </CircleBgWrapper>
        <CircleBgWrapper
          bg={"$accent11"}
          p={"$2"}
          t={300 / 2 - 19}
          r={0}
          position="absolute"
          hoverStyle={{ x: 5, bg: "$accent10" }}
          $group-hover={{ display: isRightButtonDisabled ? "none" : "flex" }}
          animation={"medium"}
          cursor={"pointer"}
          onPress={() => paginate(1)}
          z={10}
        >
          <ChevronRight />
        </CircleBgWrapper>
      </View>

      {currentSelectedMedia.type === EMediaType.Image && (
        <XStack
          gap={"$2"}
          flex={1}
          justify={"space-between"}
          items={"center"}
          key={"image-controls"}
          enterStyle={{ y: -10, opacity: 0.5 }}
          exitStyle={{ y: 10, opacity: 0.5 }}
          animation={"quickest"}
        >
          <XStack gap={"$2"}>
            <IconWrapperCard onPress={() => setZoomValue(0)}>
              <RotateCw
                color={"$color12"}
                size={16}
              />
            </IconWrapperCard>
            <IconWrapperCard
              gap={"$2"}
              flexDirection="row"
              items={"center"}
            >
              <Minus
                color={"$color12"}
                size={16}
                onPress={() => {
                  setZoomValue((prev) => (prev - STEP_VALUE <= 0 ? 0 : prev - STEP_VALUE));
                }}
              />
              <Slider
                size="$2"
                width={50}
                defaultValue={[zoomValue]}
                value={[zoomValue]}
                max={100}
                step={STEP_VALUE}
                onValueChange={(value) => {
                  setZoomValue(value[0]);
                }}
              >
                <Slider.Track
                  bg={"$color8"}
                  height={2}
                >
                  <Slider.TrackActive bg={"$color12"} />
                </Slider.Track>
                <Slider.Thumb
                  circular
                  index={0}
                  size={16}
                />
              </Slider>
              <Plus
                color={"$color12"}
                size={16}
                onPress={() => {
                  setZoomValue((prev) => (prev + STEP_VALUE >= 100 ? 100 : prev + STEP_VALUE));
                }}
              />
            </IconWrapperCard>
          </XStack>

          <XStack
            gap={"$2"}
            items={"center"}
          >
            <IconWrapperCard gap={"$4"}>
              <CloudDownload
                color={"$color12"}
                size={16}
                cursor="pointer"
                onPress={() => {}}
              />
              <ExternalLink
                color={"$color12"}
                size={16}
                cursor="pointer"
                onPress={() => {}}
              />
            </IconWrapperCard>
          </XStack>
        </XStack>
      )}
    </YStack>
  );
};

export default AssetPreviewDialog;
