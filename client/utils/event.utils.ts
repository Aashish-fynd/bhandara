import { EEventStatus } from "@/definitions/enums";

export const getEventStatusFromDate = (timing: Record<string, Date>) => {
  const now = new Date();
  const startDate = timing.startDate;
  const endDate = timing.endDate;

  if (startDate > now) return EEventStatus.Upcoming;
  if (endDate < now) return EEventStatus.Completed;
  return EEventStatus.Ongoing;
};
