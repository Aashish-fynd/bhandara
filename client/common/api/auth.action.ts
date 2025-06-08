import axiosClient from "./base";
import { Platform } from "react-native";

export const signInWithGoogle = async (token: string) => {
  try {
    const response = await axiosClient.post("/auth/google/id-token", {
      token,
      clientType: Platform.OS
    });
    return response.data;
  } catch (error: any) {}
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

export const signInWithIdToken = async (code: string, codeVerifier: string, redirectUri: string) => {
  const response = await axiosClient.post("/auth/oauth/signin-with-id-token", {
    code,
    codeVerifier,
    redirectUri
  });

  return response.data;
};

export const getUserSession = async () => {
  const response = await axiosClient.get("/auth/session");
  return response.data;
};
