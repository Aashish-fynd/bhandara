import config from "@/config";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axiosClient = axios.create({
  baseURL: config.server.url,
  withCredentials: true
});

axiosClient.interceptors.request.use(
  async (config) => {
    const sessionId = await AsyncStorage.getItem("sessionId");
    if (sessionId) {
      config.headers.cookie = `bh_session=${sessionId}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for auto logout or refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token, navigate to login, etc.
      await AsyncStorage.removeItem("sessionId");
      // Possibly trigger logout or redirect logic
    }
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorData = error?.response?.data;
    if (!errorData) {
      errorData = { error };
    }
    return Promise.reject(errorData);
  }
);

export default axiosClient;
