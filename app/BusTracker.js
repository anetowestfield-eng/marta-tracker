"use client";
import { useEffect, useState } from "react";

// The "export default" part below is what was likely broken or missing!
export default function BusTracker() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch("/api/vehicles");
        const data = await res.json();
        
        if (data.entity) {
          setVehicles(data.entity);
        }
      } catch (error) {
        console.error("Error loading buses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
    // Refresh every 10 seconds
    const interval = setInterval(fetchBuses, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading MARTA data...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Active MARTA Buses: {vehicles.length}</h1>
      <div className="grid gap-4">
        {vehicles.map((item) => {
          const v = item.vehicle;
          return (
            <div key={v.vehicle.id} className="border p-4 rounded shadow bg-white text-black">
              <p><strong>Bus ID:</strong> {v.vehicle.id}</p>
              <p><strong>Route:</strong> {v.trip?.routeId || "Unknown"}</p>
              <p><strong>Lat/Lon:</strong> {v.position?.latitude?.toFixed(4)}, {v.position?.longitude?.toFixed(4)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}