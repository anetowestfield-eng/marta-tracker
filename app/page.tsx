"use client";
import { useState, useMemo, useEffect } from "react"; 
import dynamic from "next/dynamic";
import { useBusData } from "./useBusData"; // Path fixed to single dot ./

// Dynamic Map Import: Path fixed to single dot ./
const MapWithNoSSR = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <p className="p-4">Loading Map...</p>
});

export default function Home() {
  const buses = useBusData();
  const [selectedId, setSelectedId] = useState(null);
  
  // Sorting States
  const [sortBy, setSortBy] = useState('busNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // --- 1. SORTING LOGIC ---
  const toggleSortDirection = () => {
    setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
  };

  const sortedBuses = useMemo(() => {
    if (!buses || buses.length === 0) return [];
    
    const sorted = [...buses]; 

    sorted.sort((a, b) => {
        let aVal, bVal;
        
        if (sortBy === 'busNumber') {
            aVal = parseInt(a.vehicle.vehicle.label || a.vehicle.vehicle.id);
            bVal = parseInt(b.vehicle.vehicle.label || b.vehicle.vehicle.id);
        } else if (sortBy === 'routeName') {
            aVal = a.humanRouteName || '';
            bVal = b.humanRouteName || '';
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
  }, [buses, sortBy, sortDirection]);


  // --- 2. FILTERING LOGIC ---
  const filteredBuses = useMemo(() => {
    if (!searchQuery) return sortedBuses;
    const query = searchQuery.toLowerCase();
    
    return sortedBuses.filter(item => {
        const v = item.vehicle;
        const busNumber = (v.vehicle.label || v.vehicle.id).toLowerCase();
        const routeName = (item.humanRouteName || '').toLowerCase();

        return busNumber.includes(query) || routeName.includes(query);
    });
  }, [sortedBuses, searchQuery]);


  // --- 3. AUTOMATIC HIGHLIGHTING/CENTERING LOGIC ---
  useEffect(() => {
      if (filteredBuses.length === 1) {
          setSelectedId(filteredBuses[0].vehicle.vehicle.id);
      } else if (filteredBuses.length === 0 && selectedId) {
          setSelectedId(null); 
      }
  }, [filteredBuses, setSelectedId]);


  return (
    <main className="h-screen flex flex-col md:flex-row font-sans">
      {/* LEFT SIDE: The List */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto p-4 bg-gray-100 border-r border-gray-300">
        
        <div className="sticky top-0 bg-gray-100 pb-3 z-10 border-b border-gray-300 mb-2">
            <h1 className="text-2xl font-bold">MARTA Tracker ({filteredBuses.length})</h1>
            
            {/* SEARCH INPUT */}
            <input 
                type="text"
                placeholder="Search Bus # or Route Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* SORTING CONTROLS */}
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                <span>Sort by:</span>
                
                <button
                    onClick={() => setSortBy('busNumber')}
                    className={`px-2 py-1 rounded transition-colors ${sortBy === 'busNumber' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}
                >
                    Bus #
                </button>

                <button
                    onClick={() => setSortBy('routeName')}
                    className={`px-2 py-1 rounded transition-colors ${sortBy === 'routeName' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}
                >
                    Route
                </button>

                <button
                    onClick={toggleSortDirection}
                    className="ml-auto bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                    title={`Current: ${sortDirection.toUpperCase()}`}
                >
                    {sortDirection === 'asc' ? '▲ Asc' : '▼ Desc'}
                </button>
            </div>
        </div>
        {/* === END CONTROLS === */}


        {filteredBuses.length === 0 && !searchQuery && (
            <p className="text-gray-500 italic">Waiting for bus data...</p>
        )}
        {filteredBuses.length === 0 && searchQuery && (
            <p className="text-gray-500 italic">No buses match "{searchQuery}"</p>
        )}

        <div className="grid gap-3">
          {/* Use the final filteredBuses array */}
          {filteredBuses.map((item: any) => {
            const v = item.vehicle;
            const busNumber = v.vehicle.label || v.vehicle.id;
            const id = v.vehicle.id;
            
            const isSelected = selectedId === id;

            return (
              <div 
                key={id} 
                onClick={() => setSelectedId(id)}
                className={`p-3 rounded shadow cursor-pointer transition-all border-2 ${
                  isSelected ? "bg-blue-100 border-blue-500 scale-[1.02]" : "bg-white border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="font-bold text-lg text-blue-600">
                  Bus #{busNumber}
                </div>
                <div className="text-sm text-gray-800">
                  Route: {item.humanRouteName || "N/A"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: The Map */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full relative z-0">
        <MapWithNoSSR buses={buses} selectedId={selectedId} />
      </div>
    </main>
  );
}