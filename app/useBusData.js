import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = "marta_bus_cache_v1";

// --- CONFIGURATION ---
// UPDATED: Your specific garage coordinates
const GARAGE_LAT = 33.663613; 
const GARAGE_LON = -84.387490; 

// Helper: Calculate distance in miles between two coordinates
function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useBusData() {
  const [buses, setBuses] = useState([]);
  const [routeNames, setRouteNames] = useState({});
  const latestBusesRef = useRef(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load Saved Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(bus => {
           latestBusesRef.current.set(bus.vehicle.vehicle.id, bus);
        });
        setBuses(parsed);
      }
    } catch (e) {
      console.error("Failed to load saved buses", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Fetch Route Names
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch("/api/routes");
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const map = await res.json();
           setRouteNames(map);
        }
      } catch (e) {
        console.error("Could not load route names", e);
      }
    };
    fetchRoutes();
  }, []);

  // 3. Fetch Live Buses
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (!res.ok) return; 
        
        const data = await res.json();
        const incomingBuses = data.entity || [];
        const now = Date.now();
        
        incomingBuses.forEach(bus => {
          const id = bus.vehicle.vehicle.id;
          const routeId = bus.vehicle.trip?.routeId;
          const savedBus = latestBusesRef.current.get(id);
          const humanRoute = routeNames[routeId] || savedBus?.humanRouteName || routeId; 
          
          // CALCULATE DISTANCE TO YOUR GARAGE
          const miles = getDistanceInMiles(
            GARAGE_LAT, 
            GARAGE_LON, 
            bus.vehicle.position.latitude, 
            bus.vehicle.position.longitude
          );

          latestBusesRef.current.set(id, {
            ...bus,
            humanRouteName: humanRoute,
            lastUpdated: now,
            distanceToGarage: miles // Save the distance!
          });
        });

        const newList = Array.from(latestBusesRef.current.values());
        setBuses(newList);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

      } catch (error) {
        console.error("Error fetching buses:", error);
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 10000); 
    return () => clearInterval(interval);
  }, [routeNames]);

  // --- SIMULATION MODE ---
  if (isLoaded && buses.length === 0) {
    return [{
      lastUpdated: Date.now(),
      distanceToGarage: 5.2, 
      vehicle: {
        vehicle: { id: "TEST-BUS", label: "999" },
        position: { latitude: 33.7490, longitude: -84.3880 },
        trip: { routeId: "00000" },
        humanRouteName: "TESTING MODE"
      }
    }];
  }

  return buses;
}