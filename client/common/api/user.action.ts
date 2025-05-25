import { IBaseUser } from "@/definitions/types";
import axiosClient from "./base";

export const getUserByEmail = async (email: string) => {
  const response = await axiosClient.get(`/users/query?email=${email}`);
  return response.data;
};

export const getUserByUsername = async (username: string) => {
  const response = await axiosClient.get(`/users/query?username=${username}`);
  return response.data;
};

export const createUser = async (user: any) => {
  const response = await axiosClient.post("/users", user);
  return response.data;
};

export const updateUser = async (id: string, user: any) => {
  const response = await axiosClient.patch(`/users/${id}`, user);
  return response.data;
};
