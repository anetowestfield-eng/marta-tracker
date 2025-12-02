"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapController({ selectedBus }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBus) {
      map.flyTo(
        [selectedBus.vehicle.position.latitude, selectedBus.vehicle.position.longitude], 
        15, 
        { duration: 2 }
      );
    }
  }, [selectedBus, map]);

  return null;
}

export default function Map({ buses, selectedId }) {
  const position = [33.7490, -84.3880];
  const selectedBus = buses.find(b => b.vehicle.vehicle.id === selectedId);

  return (
    <MapContainer center={position} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <MapController selectedBus={selectedBus} />
      
      {buses.map((bus) => {
        const busNumber = bus.vehicle.vehicle.label || bus.vehicle.vehicle.id;
        const isSelected = bus.vehicle.vehicle.id === selectedId;

        // Convert the timestamp to a readable time (e.g., "3:45:12 PM")
        const timeString = new Date(bus.lastUpdated).toLocaleTimeString();

        return (
          <Marker 
            key={bus.vehicle.vehicle.id} 
            position={[bus.vehicle.position.latitude, bus.vehicle.position.longitude]}
            icon={icon}
            opacity={isSelected ? 1.0 : 0.7} 
          >
            <Popup>
              <strong>Bus #{busNumber}</strong><br />
              Route: {bus.humanRouteName || "N/A"} <br />
              
              {/* This is the new Last Seen line */}
              <span style={{ fontSize: "12px", color: "#666" }}>
                Last seen: {timeString}
              </span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}