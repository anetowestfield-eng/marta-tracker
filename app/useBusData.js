import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = "marta_bus_cache_v1";

// --- CONFIGURATION ---
const GARAGE_LAT = 33.663613; 
const GARAGE_LON = -84.387490; 
const REFRESH_RATE = 3000; 
const MAX_TRAIL_LENGTH = 10; // Keep the last 10 points

function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 3958.8; 
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
           // Ensure legacy data has a trail array
           if (!bus.trail) bus.trail = [];
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
          
          const lat = bus.vehicle.position.latitude;
          const lon = bus.vehicle.position.longitude;

          const miles = getDistanceInMiles(GARAGE_LAT, GARAGE_LON, lat, lon);

          // --- BREADCRUMB LOGIC ---
          let trail = savedBus?.trail || [];
          
          // Check if the bus actually moved from the last point
          const lastPoint = trail.length > 0 ? trail[trail.length - 1] : null;
          const hasMoved = !lastPoint || (lastPoint[0] !== lat || lastPoint[1] !== lon);

          if (hasMoved) {
            trail.push([lat, lon]);
            // Keep only the last X points to save memory
            if (trail.length > MAX_TRAIL_LENGTH) {
               trail = trail.slice(-MAX_TRAIL_LENGTH);
            }
          }

          latestBusesRef.current.set(id, {
            ...bus,
            humanRouteName: humanRoute,
            lastUpdated: now, 
            distanceToGarage: miles,
            trail: trail // Save the history
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
    const interval = setInterval(fetchBuses, REFRESH_RATE); 
    return () => clearInterval(interval);
  }, [routeNames]);

  // --- SIMULATION MODE ---
  if (isLoaded && buses.length === 0) {
    return [{
      lastUpdated: Date.now(),
      distanceToGarage: 5.2, 
      trail: [[33.7480, -84.3870], [33.7485, -84.3875], [33.7490, -84.3880]], // Fake trail
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