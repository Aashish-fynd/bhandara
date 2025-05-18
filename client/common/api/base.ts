import config from "@/config";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: config.server.url,
  withCredentials: true
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error?.response?.data || error)
);

export default axiosClient;
