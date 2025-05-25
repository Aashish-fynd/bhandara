import config from "@/config";
import { IAddress } from "@/definitions/types";
import axios from "axios";

export const suggestSearchResults = async ({
  search,
  proximity,
  sessionToken
}: {
  search: string;
  proximity?: [number, number];
  sessionToken: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.set("access_token", config.mapbox.accessToken);
  queryParams.set("session_token", sessionToken);
  queryParams.set("q", search);
  queryParams.set("language", "en");

  if (proximity) {
    queryParams.set("proximity", proximity.join(","));
  }

  const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/suggest?${queryParams.toString()}`);
  return response.data.suggestions;
};

export const retrieveSearchItem = async ({ mapboxId, sessionToken }: { mapboxId: string; sessionToken: string }) => {
  const response = await axios.get(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?session_token=${sessionToken}&access_token=${config.mapbox.accessToken}`
  );
  return response.data.features[0];
};

export const getAddressFromCoordinates = async ({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}): Promise<IAddress | null> => {
  const queryParams = new URLSearchParams();
  queryParams.set("access_token", config.mapbox.accessToken);
  queryParams.set("longitude", longitude.toString());
  queryParams.set("latitude", latitude.toString());
  queryParams.set("language", "en");
  queryParams.set("limit", "1");
  const url = `https://api.mapbox.com/search/geocode/v6/reverse?${queryParams.toString()}`;
  const response = await axios.get(url);

  const feature = response.data.features[0];

  if (!feature) return null;

  const contextKeyAlias = {
    place: "city",
    region: "state",
    address: "place"
  };

  const addressInfo: Record<string, string> = {};

  Object.entries(feature.properties.context).forEach(([key, value]: [string, any]) => {
    const alias = contextKeyAlias[key as keyof typeof contextKeyAlias];
    addressInfo[alias || key] = value.name;
  });

  return {
    address: feature.properties.full_address,
    ...addressInfo
  } as any;
};
