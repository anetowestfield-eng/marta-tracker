import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = "marta_bus_cache_v1";

export function useBusData() {
  const [buses, setBuses] = useState([]);
  const [routeNames, setRouteNames] = useState({});
  const latestBusesRef = useRef(new Map());
  const [isLoaded, setIsLoaded] = useState(false); 

  // 1. Load Saved Data from Local Storage (Persistence)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Rebuild the Map from saved array
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

  // 2. Fetch Route Names (The Dictionary)
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
        // If fetch fails, we simply return and KEEP the old data on screen
        if (!res.ok) return; 
        
        const data = await res.json();
        const incomingBuses = data.entity || [];
        const now = Date.now();
        
        // Merge new data into our Master List 
        incomingBuses.forEach(bus => {
          const id = bus.vehicle.vehicle.id;
          const routeId = bus.vehicle.trip?.routeId;
          
          // Use the dictionary name, or the saved name, or the raw ID
          const savedBus = latestBusesRef.current.get(id);
          const humanRoute = routeNames[routeId] || savedBus?.humanRouteName || routeId; 
          
          latestBusesRef.current.set(id, {
            ...bus,
            humanRouteName: humanRoute,
            lastUpdated: now // Update the last seen timestamp
          });
        });

        // NOTE: The GHOST REMOVAL LOGIC IS DELIBERATELY OMITTED
        // Buses will never disappear until the user clears local storage/cache.

        const newList = Array.from(latestBusesRef.current.values());
        setBuses(newList);

        // Save new list to Local Storage
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
  // Show the Test Bus if the app has loaded and found no data
  if (isLoaded && buses.length === 0) {
    return [{
      lastUpdated: Date.now(),
      vehicle: {
        vehicle: { id: "TEST-BUS", label: "999" },
        position: { latitude: 33.7490, longitude: -84.3880 },
        trip: { routeId: "00000" },
        humanRouteName: "TESTING MODE - Waiting for Morning"
      }
    }];
  }

  return buses;
}