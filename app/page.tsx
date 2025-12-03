"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useBusData } from "./useBusData"; 

// FIX: We moved "as any" to the end. This forces TypeScript to accept ALL props.
const MapWithNoSSR = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <p className="p-4">Loading Map...</p>
}) as any;

export default function Home() {
  const buses = useBusData();
  const [selectedId, setSelectedId] = useState(null);
  
  // NEW STATE: List of pinned bus IDs
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState('distance'); 
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSortDirection = () => {
    setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
  };

  // Logic to toggle a pin
  const togglePin = (e: any, id: string) => {
    e.stopPropagation(); // Don't trigger the "select bus" click
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const sortedBuses = useMemo(() => {
    if (!buses || buses.length === 0) return [];
    
    const sorted = [...buses]; 

    sorted.sort((a: any, b: any) => {
        // 0. PRIORITY CHECK: Is it Pinned?
        const aPinned = pinnedIds.includes(a.vehicle.vehicle.id);
        const bPinned = pinnedIds.includes(b.vehicle.vehicle.id);
        
        // If A is pinned and B is not, A comes first
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        // 1. If both are pinned (or both not), use normal sorting
        let aVal, bVal;
        
        if (sortBy === 'busNumber') {
            aVal = parseInt(a.vehicle.vehicle.label || a.vehicle.vehicle.id);
            bVal = parseInt(b.vehicle.vehicle.label || b.vehicle.vehicle.id);
        } else if (sortBy === 'routeName') {
            aVal = a.humanRouteName || '';
            bVal = b.humanRouteName || '';
        } else if (sortBy === 'distance') {
            aVal = a.distanceToGarage || 0;
            bVal = b.distanceToGarage || 0;
        }
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
        } else {
            comparison = aVal - bVal;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [buses, sortBy, sortDirection, pinnedIds]);

  const filteredBuses = useMemo(() => {
    if (!searchQuery) return sortedBuses;
    const query = searchQuery.toLowerCase();
    
    return sortedBuses.filter((item: any) => {
        const v = item.vehicle;
        const busNumber = (v.vehicle.label || v.vehicle.id).toLowerCase();
        const routeName = (item.humanRouteName || '').toLowerCase();
        return busNumber.includes(query) || routeName.includes(query);
    });
  }, [sortedBuses, searchQuery]);

  // Load pins from localStorage on startup (Optional persistence)
  useEffect(() => {
    const saved = localStorage.getItem("marta_pinned_buses");
    if (saved) setPinnedIds(JSON.parse(saved));
  }, []);

  // Save pins whenever they change
  useEffect(() => {
    localStorage.setItem("marta_pinned_buses", JSON.stringify(pinnedIds));
  }, [pinnedIds]);


  return (
    <main className="h-screen flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto p-4 bg-gray-100 border-r border-gray-300">
        
        <div className="sticky top-0 bg-gray-100 pb-3 z-10 border-b border-gray-300 mb-2">
            <h1 className="text-2xl font-bold">Garage Tracker ({filteredBuses.length})</h1>
            
            <input 
                type="text"
                placeholder="Search Bus # or Route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 overflow-x-auto pb-1">
                <span className="whitespace-nowrap">Sort:</span>
                <button onClick={() => setSortBy('distance')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'distance' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Dist</button>
                <button onClick={() => setSortBy('busNumber')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'busNumber' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Bus #</button>
                <button onClick={() => setSortBy('routeName')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'routeName' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Route</button>
                <button onClick={toggleSortDirection} className="ml-auto bg-gray-300 px-2 py-1 rounded">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                </button>
            </div>
        </div>

        {filteredBuses.length === 0 && !searchQuery && <p className="text-gray-500 italic">Waiting for bus data...</p>}
        {filteredBuses.length === 0 && searchQuery && <p className="text-gray-500 italic">No buses match your search.</p>}

        <div className="grid gap-3">
          {filteredBuses.map((item: any) => {
            const v = item.vehicle;
            const busNumber = v.vehicle.label || v.vehicle.id;
            const id = v.vehicle.id;
            const isSelected = selectedId === id;
            const isPinned = pinnedIds.includes(id);
            const miles = item.distanceToGarage ? item.distanceToGarage.toFixed(1) : "?";

            return (
              <div 
                key={id} 
                onClick={() => setSelectedId(id)}
                className={`p-3 rounded shadow cursor-pointer transition-all border-2 relative ${
                  isSelected ? "bg-blue-100 border-blue-500 scale-[1.02]" : "bg-white border-transparent hover:bg-gray-50"
                } ${isPinned ? "border-l-8 border-l-red-500" : ""}`}
              >
                <button 
                  onClick={(e) => togglePin(e, id)}
                  className="absolute top-2 right-2 text-2xl hover:scale-110 transition-transform focus:outline-none"
                  title={isPinned ? "Unpin Bus" : "Pin Bus to Top"}
                >
                  {isPinned ? "⭐" : "☆"}
                </button>

                <div className="flex justify-between items-start pr-8">
                    <div>
                        <div className="font-bold text-lg text-blue-600">Bus #{busNumber}</div>
                        <div className="text-sm text-gray-800">Route: {item.humanRouteName || "N/A"}</div>
                    </div>
                    <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        {miles} mi
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full md:w-2/3 h-1/2 md:h-full relative z-0">
        <MapWithNoSSR buses={buses} selectedId={selectedId} pinnedIds={pinnedIds} />
      </div>
    </main>
  );
}