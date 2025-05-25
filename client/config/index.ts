const config = {
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
  },
  server: {
    url: process.env.EXPO_PUBLIC_SERVER_URL || ""
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ""
  }
};

export default Object.freeze(config);
