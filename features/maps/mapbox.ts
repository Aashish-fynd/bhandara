import config from "@/config";
import Mapbox from "@rnmapbox/maps";

Mapbox.setAccessToken(config.mapbox.accessToken);

export default Mapbox;
