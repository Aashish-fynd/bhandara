import { StyleSheet } from "react-native";
import Mapbox, { MapView, UserTrackingMode } from "@rnmapbox/maps";
import config from "@/config";
import { RefObject, useEffect, useRef } from "react";

Mapbox.setAccessToken(config.mapbox.accessToken);

Mapbox.setTelemetryEnabled(false);

const styles = StyleSheet.create({
  map: {
    flex: 1,
    height: "100%",
    width: "100%"
  }
});

export default function MapViewComponent({
  consumerRef,
  initialLocation,
  searchRef
}: {
  consumerRef: RefObject<any>;
  initialLocation?: number[];
  searchRef: RefObject<{ setCallBack: (callback: (result: any) => void) => void }>;
}) {
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    consumerRef.current.setCallBack((result: any) => {
      console.log(result);
    });
  }, []);

  return (
    <MapView
      style={styles.map}
      compassEnabled={true}
      zoomEnabled={true}
    >
      <Mapbox.Camera
        ref={cameraRef}
        followUserMode={UserTrackingMode.Follow}
        followUserLocation={false} // set true if you want to follow by default
        zoomLevel={14}
      />

      <Mapbox.UserLocation
        visible={true}
        showsUserHeadingIndicator={true}
      />
    </MapView>
  );
}
