import { StyleSheet } from "react-native";
import Mapbox, { MapView, Camera, UserLocation, PointAnnotation, ShapeSource, FillLayer } from "@rnmapbox/maps";
import config from "@/config";
import { useRef } from "react";

Mapbox.setAccessToken(config.mapbox.accessToken);
Mapbox.setTelemetryEnabled(false);

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%", height: "100%" }
});

function generateCircleCoords(center: [number, number], radius: number, points = 64) {
  const [lng, lat] = center;
  const coords = [] as [number, number][];
  const distanceX = (radius / 111320) * Math.cos((lat * Math.PI) / 180);
  const distanceY = radius / 110540;
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = lng + distanceX * Math.cos(theta);
    const y = lat + distanceY * Math.sin(theta);
    coords.push([x, y]);
  }
  return coords;
}

export default function VerificationMap({
  eventCoords,
  eventName,
  userCoords,
  radius,
  onUserLocationChange
}: {
  eventCoords: [number, number];
  eventName: string;
  userCoords: [number, number];
  radius: number;
  onUserLocationChange: (coords: [number, number]) => void;
  zoomLevel?: number;
}) {
  const circle = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [generateCircleCoords(eventCoords, radius)]
    }
  } as const;

  const cameraRef = useRef<Camera>(null);

  const handleUserLocation = (loc: any) => {
    onUserLocationChange([loc.coords.longitude, loc.coords.latitude]);
  };

  return (
    <MapView
      style={styles.map}
      compassEnabled
      zoomEnabled
    >
      <Camera
        ref={cameraRef}
        centerCoordinate={eventCoords}
        zoomLevel={17}
      />
      <UserLocation
        visible
        showsUserHeadingIndicator
        onUpdate={handleUserLocation}
      />
      <ShapeSource
        id="verify-circle"
        shape={circle}
      >
        <FillLayer
          id="verify-fill"
          style={{ fillColor: "rgba(0,122,255,0.2)", fillOutlineColor: "rgba(0,122,255,0.5)" }}
        />
      </ShapeSource>
      <PointAnnotation
        id="event-location"
        coordinate={eventCoords}
      />
    </MapView>
  );
}
