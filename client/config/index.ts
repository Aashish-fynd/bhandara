// for testing only
// import dotenv from "dotenv";

// dotenv.config();

const config = {
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN || ""
  }
};

export default Object.freeze(config);
