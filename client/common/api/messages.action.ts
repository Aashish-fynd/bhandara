import axiosClient from "./base";

type GetMessagesForThreadProps = {
  threadId: string;
};

type GetChildMessagesForThreadProps = {
  threadId: string;
  parentId: string;
};

type GetMessageByIdProps = {
  threadId: string;
  messageId: string;
};

export const getMessagesForThread = async ({ threadId }: GetMessagesForThreadProps) => {
  const messagesResponse = await axiosClient.get(`/threads/${threadId}/messages`);
  return messagesResponse.data;
};

export const getChildMessagesForThread = async ({ threadId, parentId }: GetChildMessagesForThreadProps) => {
  const response = await axiosClient.get(`/threads/${threadId}/child-messages/${parentId}`);
  return response.data;
};

export const getMessageById = async ({ threadId, messageId }: GetMessageByIdProps) => {
  const response = await axiosClient.get(`/threads/${threadId}/messages/${messageId}`);
  return response.data;
};
