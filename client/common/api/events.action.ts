import { IBaseResponse, IEvent, IPaginationParams } from "@/definitions/types";
import { EEventStatus } from "@/definitions/enums";
import axiosClient from "./base";
import { formTruthyValues } from "@/utils";

export const getAllEvents = async (): Promise<{
  data: { items: IEvent[]; pagination: IPaginationParams };
  error: any;
}> => {
  const response = await axiosClient.get("/v1/events");
  return response.data;
};

export const getEventById = async (
  id: string
): Promise<{
  data: IEvent;
  error: any;
}> => {
  const response = await axiosClient.get(`/v1/events/${id}`);
  return response.data;
};

export const getEventThreads = async (eventId: string, pagination?: Partial<IPaginationParams>) => {
  if (!eventId) return;
  const queryParams = new URLSearchParams(formTruthyValues(pagination || {}));
  const threadsResponse = await axiosClient.get(`/v1/events/${eventId}/threads?${queryParams.toString()}`);
  return threadsResponse.data;
};

export const createEvent = async (data: Record<string, any>): Promise<IBaseResponse<IEvent>> => {
  const createResponse = await axiosClient.post("/v1/events", data);
  return createResponse.data;
};

export const updateEvent = async (id: string, data: Record<string, any>): Promise<IBaseResponse<IEvent>> => {
  const res = await axiosClient.put(`/v1/events/${id}`, data);
  return res.data;
};

export const cancelEvent = async (id: string): Promise<IBaseResponse<IEvent>> => {
  const res = await axiosClient.put(`/v1/events/${id}`, { status: EEventStatus.Cancelled });
  return res.data;
};

export const getUserEvents = async (
  userId: string
): Promise<{ data: { items: IEvent[]; pagination: IPaginationParams }; error: any }> => {
  const res = await axiosClient.get(`/v1/events?createdBy=${userId}&status=draft,upcoming,ongoing,completed,cancelled`);
  return res.data;
};

export const verifyEvent = async (
  eventId: string,
  currentCoordinates: { latitude: number; longitude: number }
): Promise<IBaseResponse<boolean>> => {
  const res = await axiosClient.post(`/v1/events/${eventId}/verify`, {
    currentCoordinates
  });
  return res.data;
};

export const disassociateMediaFromEvent = async (eventId: string, mediaId: string): Promise<IBaseResponse<boolean>> => {
  const res = await axiosClient.delete(`/v1/events/${eventId}/media/${mediaId}`);
  return res.data;
};
export const dissociateTagFromEvent = async (eventId: string, tagId: string): Promise<IBaseResponse<boolean>> => {
  const res = await axiosClient.delete(`/v1/events/${eventId}/tags/${tagId}`);
  return res.data;
};
