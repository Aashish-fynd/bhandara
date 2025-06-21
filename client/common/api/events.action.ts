import { IEvent, IPaginationParams } from "@/definitions/types";
import axiosClient from "./base";
import { formTruthyValues } from "@/utils";

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

export const getEventThreads = async (eventId: string, pagination?: Partial<IPaginationParams>) => {
  if (!eventId) return;
  const queryParams = new URLSearchParams(formTruthyValues(pagination || {}));
  const threadsResponse = await axiosClient.get(`/events/${eventId}/threads?${queryParams.toString()}`);
  return threadsResponse.data;
};
