import mapboxgl from "mapbox-gl";
import config from "@/config";
import { useEffect, useRef } from "react";
import { View } from "tamagui";
import { OutlineButton } from "../ui/Buttons";
import { RotateCcw } from "@tamagui/lucide-icons";

function generateCircleCoords(center: [number, number], radius: number, points = 64) {
  const [lng, lat] = center;
  const coords = [] as [number, number][];

  // Convert radius from meters to degrees (approximate)
  // 1 degree of latitude ≈ 111,320 meters
  // 1 degree of longitude ≈ 111,320 * cos(latitude) meters
  const latRadius = radius / 111320;
  const lngRadius = radius / (111320 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = lng + lngRadius * Math.cos(theta);
    const y = lat + latRadius * Math.sin(theta);
    coords.push([x, y]);
  }
  return coords;
}

export default function VerificationMap({
  eventCoords,
  radius,
  onUserLocationChange,
  eventName,
  userCoords,
  zoomLevel
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

  const _zoomLevel = zoomLevel || 15;

  const mapRef = useRef<mapboxgl.Map>();
  const mapContainerRef = useRef<any>();
  const markerRef = useRef<mapboxgl.Marker>();
  const places = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          description: eventName,
          icon: "bar"
        },
        geometry: {
          type: "Point",
          coordinates: eventCoords
        }
      }
    ]
  };

  useEffect(() => {
    mapboxgl.accessToken = config.mapbox.accessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: eventCoords,
      zoom: _zoomLevel,
      doubleClickZoom: false,
      scrollZoom: false
    });

    const marker = new mapboxgl.Marker({ draggable: true }).setLngLat(userCoords).addTo(mapRef.current);
    markerRef.current = marker;

    const geoLocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true
    });
    mapRef.current.addControl(geoLocateControl);

    geoLocateControl.on("geolocate", (e) => {
      onUserLocationChange([e.coords.longitude, e.coords.latitude]);
    });

    mapRef.current.on("load", () => {
      mapRef.current?.addSource("circle", {
        type: "geojson",
        data: circle as any
      });

      mapRef.current?.addLayer({
        id: "circle-fill",
        type: "fill",
        source: "circle",
        paint: {
          "fill-color": "red",
          "fill-opacity": 0.3
        }
      });

      mapRef.current?.addLayer({
        id: "circle-outline",
        type: "line",
        source: "circle",
        paint: {
          "line-color": "red",
          "line-width": 1.5
        }
      });

      mapRef.current?.addSource("places", {
        type: "geojson",
        data: places as any
      });

      mapRef.current?.addLayer({
        id: "poi-labels",
        type: "symbol",
        source: "places",
        layout: {
          "text-field": ["get", "description"],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.5,
          "text-justify": "auto",
          "icon-image": ["get", "icon"]
        }
      });
    });

    return () => {
      mapRef.current?.remove();
      markerRef.current?.remove();
    };
  }, []);

  return (
    <View
      position="relative"
      width={"100%"}
      height={400}
      flex={1}
    >
      <View
        id="map-container"
        width={"100%"}
        height={"100%"}
        ref={mapContainerRef}
      />

      <OutlineButton
        p={"$2"}
        t={50}
        r={10}
        position="absolute"
        rounded={"$2"}
        onPress={() => {
          mapRef.current?.flyTo({
            center: eventCoords,
            zoom: _zoomLevel,
            speed: 1,
            curve: 1.42,
            essential: true
          });
        }}
        icon={<RotateCcw />}
      />
    </View>
  );
}
