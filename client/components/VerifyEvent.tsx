import React, { useState } from "react";
import { IEvent, IBaseUser } from "@/definitions/types";
import { useAuth } from "@/contexts/AuthContext";
import { OutlineButton, FilledButton } from "@/components/ui/Buttons";
import { CardWrapper } from "@/components/ui/common-styles";
import { H6, Text, View } from "tamagui";
import { useDialog } from "@/hooks/useModal";
import VerificationMap from "@/components/maps/VerificationMap";
import { EVENT_VERIFY_RADIUS_M } from "@/constants/global";
import { haversineDistanceInM } from "@/utils/location";
import { verifyEvent } from "@/common/api/events.action";
import { useToastController } from "@tamagui/toast";
import { Check } from "@tamagui/lucide-icons";
import CustomTooltip from "@/components/CustomTooltip";
import { formatDateWithTimeString } from "@/utils/date.utils";
import { SpinningLoader } from "@/components/ui/Loaders";

const VerifyEvent = ({
  event,
  onVerified
}: {
  event: IEvent;
  onVerified: (verifier: { user: IBaseUser; verifiedAt: string }) => void;
}) => {
  const { user } = useAuth();
  const isCreator = user?.id === event.createdBy;
  const existingVerifier = event.verifiers.find((v) => {
    const id = typeof v.user === "string" ? v.user : v.user.id;
    return id === user?.id;
  });

  const { open, close, RenderContent } = useDialog();
  const toast = useToastController();
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isCreator) return null;

  const canVerify =
    userCoords &&
    haversineDistanceInM(
      { latitude: userCoords[1], longitude: userCoords[0] },
      { latitude: event.location.latitude!, longitude: event.location.longitude! }
    ) <= EVENT_VERIFY_RADIUS_M;

  const handleVerify = async () => {
    if (!userCoords) return;
    setIsSubmitting(true);
    try {
      await verifyEvent(event.id, {
        latitude: userCoords[1],
        longitude: userCoords[0]
      });
      onVerified({ user: user as IBaseUser, verifiedAt: new Date().toISOString() });
      close();
    } catch (error: any) {
      toast.show(error?.message || "Failed to verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const button = existingVerifier ? (
    <CustomTooltip
      trigger={
        <OutlineButton size="medium" width="auto" disabled>
          <Check size={16} />
          <Text>Verified</Text>
        </OutlineButton>
      }
    >
      <CardWrapper rounded="$3" p="$2">
        <Text fontSize="$2">
          Verified at {formatDateWithTimeString(existingVerifier.verifiedAt as any)}
        </Text>
      </CardWrapper>
    </CustomTooltip>
  ) : (
    <OutlineButton size="medium" width="auto" onPress={open} px="$2">
      <Check size={16} />
      <Text>Verify Event</Text>
    </OutlineButton>
  );

  return (
    <>
      {button}
      <RenderContent>
        <CardWrapper gap="$4" width={300}>
          <H6>Verify Attendance</H6>
          <View height={200} width="100%">
            <VerificationMap
              eventCoords={[event.location.longitude!, event.location.latitude!]}
              radius={EVENT_VERIFY_RADIUS_M}
              onUserLocationChange={setUserCoords}
            />
          </View>
          <FilledButton
            size="medium"
            disabled={!canVerify || isSubmitting}
            onPress={handleVerify}
            iconAfter={isSubmitting ? <SpinningLoader /> : undefined}
          >
            Verify Now
          </FilledButton>
        </CardWrapper>
      </RenderContent>
    </>
  );
};

export default VerifyEvent;
