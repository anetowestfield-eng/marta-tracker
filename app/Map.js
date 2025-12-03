"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- 1. DEFINE THE ICONS ---

// The Standard BLUE Icon (Active Buses)
const blueIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// The GREY Icon (Stale/Ghost Buses)
const greyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
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
        15, { duration: 2 }
      );
    }
  }, [selectedBus, map]);
  return null;
}

export default function Map({ buses, selectedId }) {
  const position = [33.7490, -84.3880];
  const selectedBus = buses.find(b => b.vehicle.vehicle.id === selectedId);
  
  // We need a re-render every minute to update the "grey" status live
  // so we use a simple state to trigger updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <MapContainer center={position} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap'
      />
      <MapController selectedBus={selectedBus} />
      
      {buses.map((bus) => {
        const busNumber = bus.vehicle.vehicle.label || bus.vehicle.vehicle.id;
        const isSelected = bus.vehicle.vehicle.id === selectedId;
        const timeString = new Date(bus.lastUpdated).toLocaleTimeString();
        const lat = bus.vehicle.position.latitude;
        const lon = bus.vehicle.position.longitude;
        const miles = bus.distanceToGarage ? bus.distanceToGarage.toFixed(1) : "?";

        // --- CHECK IF BUS IS STALE (Older than 1 Hour) ---
        const ONE_HOUR = 60 * 60 * 1000; // 3,600,000 ms
        const isStale = (Date.now() - bus.lastUpdated) > ONE_HOUR;

        // Choose the correct icon
        const currentIcon = isStale ? greyIcon : blueIcon;

        return (
          <Marker 
            key={bus.vehicle.vehicle.id} 
            position={[lat, lon]}
            icon={currentIcon}
            // If selected, full opacity. If stale, slightly faded (0.6). If active, normal (0.8).
            opacity={isSelected ? 1.0 : (isStale ? 0.6 : 0.8)} 
          >
            <Popup>
              <strong>Bus #{busNumber}</strong> 
              {isStale && <span style={{color: "gray", fontSize: "11px"}}> (Inactive)</span>}
              <br />
              Route: {bus.humanRouteName || "N/A"} <br />
              
              <div style={{fontWeight: "bold", color: "#d9534f", margin: "4px 0"}}>
                 {miles} miles from garage
              </div>
              
              <span style={{ fontSize: "12px", color: isStale ? "red" : "#666" }}>
                Last seen: {timeString}
              </span>

              <div style={{ marginTop: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    backgroundColor: "#4285F4",
                    color: "white",
                    textAlign: "center",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "bold"
                  }}
                >
                  🚗 Navigate to Bus
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}