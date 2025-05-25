import config from "@/config";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: config.server.url,
  withCredentials: true
});

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
