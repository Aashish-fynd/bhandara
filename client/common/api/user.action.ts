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

export const signupWithEmailAndPassword = async (user: any) => {
  const response = await axiosClient.post("/auth/signup", user);
  return response.data;
};

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  const response = await axiosClient.post("/auth/login", { email, password });
  return response.data;
};

export const logout = async () => {
  const response = await axiosClient.post("/logout");
  return response.data;
};
