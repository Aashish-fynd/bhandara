const config = {
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
  },
  server: {
    url: process.env.EXPO_PUBLIC_SERVER_URL || ""
  }
};

export default Object.freeze(config);
