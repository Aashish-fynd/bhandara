import { CardWrapper } from "@/components/ui/common-styles";
import { Text, XStack } from "tamagui";
import { useAuth } from "@/contexts/AuthContext";
import { useDataLoader } from "@/hooks";
import { getUserEvents } from "@/common/api/events.action";
import { IEvent } from "@/definitions/types";
import { Badge } from "@/components/ui/Badge";
import { EEventStatus } from "@/definitions/enums";

const ActivityTabContent = () => {
  const { user } = useAuth();
  const { data } = useDataLoader({
    promiseFunction: () => getUserEvents(user!.id),
    enabled: !!user
  });

  const events = data?.data?.items || [];

  return (
    <CardWrapper gap="$2">
      {events.map((e: IEvent) => (
        <XStack
          key={e.id}
          justify="space-between"
          items="center"
        >
          <Text>{e.name}</Text>
          <Badge outline-success={e.status !== EEventStatus.Draft}>
            <Badge.Text
              fontSize="$2"
              color={e.status === EEventStatus.Draft ? "$red11" : "$green11"}
            >
              {e.status === EEventStatus.Draft ? "Draft" : "Live"}
            </Badge.Text>
          </Badge>
        </XStack>
      ))}
      {!events.length && <Text>No Events</Text>}
    </CardWrapper>
  );
};

export default ActivityTabContent;
