"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- ICONS ---
const blueIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
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

// NOTICE: We added 'pinnedIds = []' to the inputs here
export default function Map({ buses, selectedId, pinnedIds = [] }) {
  const position = [33.7490, -84.3880];
  const selectedBus = buses.find(b => b.vehicle.vehicle.id === selectedId);
  
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
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
        const id = bus.vehicle.vehicle.id;
        const busNumber = bus.vehicle.vehicle.label || id;
        const isSelected = id === selectedId;
        const isPinned = pinnedIds.includes(id); 
        const lat = bus.vehicle.position.latitude;
        const lon = bus.vehicle.position.longitude;
        const miles = bus.distanceToGarage ? bus.distanceToGarage.toFixed(1) : "?";

        const ONE_HOUR = 60 * 60 * 1000;
        const isStale = (Date.now() - bus.lastUpdated) > ONE_HOUR;
        const timeString = new Date(bus.lastUpdated).toLocaleTimeString();

        let currentIcon = blueIcon;
        if (isPinned) currentIcon = redIcon;
        else if (isStale) currentIcon = greyIcon;

        return (
          <Marker 
            key={id} 
            position={[lat, lon]}
            icon={currentIcon}
            opacity={isSelected ? 1.0 : (isStale && !isPinned ? 0.6 : 0.9)}
            zIndexOffset={isPinned ? 1000 : 0} 
          >
            <Popup>
              <strong>Bus #{busNumber}</strong> 
              {isPinned && <span style={{color: "red", fontWeight: "bold"}}> (WORK ORDER)</span>}
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