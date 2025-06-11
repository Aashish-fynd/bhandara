import { isEmpty } from "@/utils";
import axiosClient from "./base";

type GetThreadByIdParams = {
  id: string;
  includeMessages?: boolean | number;
};
export const getThreadById = async ({ id, includeMessages = false }: GetThreadByIdParams) => {
  const threadResponse = await axiosClient.get(`/threads/${id}?includeMessage=${includeMessages}`);
  return threadResponse.data;
};
