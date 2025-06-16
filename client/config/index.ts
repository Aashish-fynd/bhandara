const config = {
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
  },
  server: {
    baseURL: process.env.EXPO_PUBLIC_SERVER_URL || "",
    url: `${process.env.EXPO_PUBLIC_SERVER_URL || ""}/api`
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ""
  }
};

export default Object.freeze(config);
