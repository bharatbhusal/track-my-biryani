"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Fix default marker icon (leaflet's default icon path is broken with bundlers)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Location = {
  latitude: number;
  longitude: number;
};

type LocationPickerProps = {
  location: Location;
  onLocationChange: (loc: Location) => void;
  height?: number;
};

function DraggableMarker({
  location,
  onLocationChange,
}: {
  location: Location;
  onLocationChange: (loc: Location) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onLocationChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={[location.latitude, location.longitude]}
      draggable
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const pos = marker.getLatLng();
            onLocationChange({
              latitude: pos.lat,
              longitude: pos.lng,
            });
          }
        },
      }}
    />
  );
}

function MapRecenterView({ location }: { location: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.latitude, location.longitude], map.getZoom());
  }, [location, map]);
  return null;
}

export function LocationPicker({ location, onLocationChange, height = 250 }: LocationPickerProps) {
  if (!location.latitude || !location.longitude) return null;

  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--color-border)] relative z-0"
      style={{ height }}
    >
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={14}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <DraggableMarker location={location} onLocationChange={onLocationChange} />
        <MapRecenterView location={location} />
      </MapContainer>
    </div>
  );
}
