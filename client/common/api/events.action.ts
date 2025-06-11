import { IEvent, IPaginationParams } from "@/definitions/types";
import axiosClient from "./base";

export const getAllEvents = async (): Promise<{
  data: { items: IEvent[]; pagination: IPaginationParams };
  error: any;
}> => {
  const response = await axiosClient.get("/events");
  return response.data;
};

export const getEventById = async (
  id: string
): Promise<{
  data: IEvent & { threads: { qna: string; discussion: string } };
  error: any;
}> => {
  const response = await axiosClient.get(`/events/${id}`);
  return response.data;
};
