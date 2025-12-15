"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useBusData } from "../useBusData"; 

const MapWithNoSSR = dynamic(() => import("../Map"), { 
  ssr: false,
  loading: () => <p className="p-4">Loading Map...</p>
}) as any;

export default function TrackerPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const { buses, clearData } = useBusData();
  
  const [selectedId, setSelectedId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('distance'); 
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- THIS IS THE NEW VIEW MODE STATE ---
  const [viewMode, setViewMode] = useState('all'); // Options: 'all', 'road', 'garage'

  // Force re-render for ghost timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const toggleSortDirection = () => {
    setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
  };

  const togglePin = (e: any, id: string) => {
    e.stopPropagation(); 
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // --- CYCLING LOGIC ---
  const cycleViewMode = () => {
    if (viewMode === 'all') setViewMode('road');
    else if (viewMode === 'road') setViewMode('garage');
    else setViewMode('all');
  };

  const sortedBuses = useMemo(() => {
    if (!buses || buses.length === 0) return [];
    
    const sorted = [...buses]; 

    sorted.sort((a: any, b: any) => {
        const aPinned = pinnedIds.includes(a.vehicle.vehicle.id);
        const bPinned = pinnedIds.includes(b.vehicle.vehicle.id);
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;

        let valA, valB;
        if (sortBy === 'busNumber') {
            valA = parseInt(a.vehicle.vehicle.label || a.vehicle.vehicle.id);
            valB = parseInt(b.vehicle.vehicle.label || b.vehicle.vehicle.id);
        } else if (sortBy === 'routeName') {
            valA = a.humanRouteName || '';
            valB = b.humanRouteName || '';
        } else if (sortBy === 'distance') {
            valA = a.distanceToGarage || 0;
            valB = b.distanceToGarage || 0;
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        
        const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [buses, sortBy, sortDirection, pinnedIds]);

  const filteredBuses = useMemo(() => {
    let result = sortedBuses;

    // --- FILTER LOGIC ---
    if (viewMode === 'road') {
        // HIDE GARAGE (Show only > 0.3 miles away)
        result = result.filter((item: any) => !item.distanceToGarage || item.distanceToGarage > 0.3);
    } else if (viewMode === 'garage') {
        // SHOW ONLY GARAGE (Show only <= 0.3 miles away)
        result = result.filter((item: any) => item.distanceToGarage && item.distanceToGarage <= 0.3);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter((item: any) => {
            const v = item.vehicle;
            const busNumber = (v.vehicle.label || v.vehicle.id).toLowerCase();
            const routeName = (item.humanRouteName || '').toLowerCase();
            return busNumber.includes(query) || routeName.includes(query);
        });
    }
    
    return result;
  }, [sortedBuses, searchQuery, viewMode]);

  useEffect(() => {
    const saved = localStorage.getItem("marta_pinned_buses");
    if (saved) setPinnedIds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("marta_pinned_buses", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  if (!isLoaded || !isSignedIn) {
    return <div className="h-screen flex items-center justify-center">Loading Access...</div>;
  }

  return (
    <main className="h-screen flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto p-4 bg-gray-100 border-r border-gray-300">
        
        <div className="sticky top-0 bg-gray-100 pb-3 z-10 border-b border-gray-300 mb-2">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-blue-900">
                  Hamilton Tracker ({filteredBuses.length})
                </h1>
                
                <div className="flex gap-2">
                    <button 
                        onClick={clearData}
                        className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 border border-red-200 font-bold"
                    >
                        Reset Map
                    </button>
                </div>
            </div>
            
            <input 
                type="text"
                placeholder="Search Bus # or Route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 overflow-x-auto pb-1">
                
                {/* --- 3-WAY BUTTON --- */}
                <button
                    onClick={cycleViewMode}
                    className={`px-3 py-1 rounded font-bold transition-colors border whitespace-nowrap shadow-sm ${
                        viewMode === 'all' ? 'bg-white text-gray-700 hover:bg-gray-100' :
                        viewMode === 'road' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        'bg-purple-100 text-purple-800 border-purple-300'
                    }`}
                >
                    {viewMode === 'all' ? "View: ALL" : 
                     viewMode === 'road' ? "View: ROAD" : 
                     "View: GARAGE"}
                </button>

                <div className="h-4 w-px bg-gray-300 mx-1"></div>

                <button onClick={() => setSortBy('distance')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'distance' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Dist</button>
                <button onClick={() => setSortBy('busNumber')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'busNumber' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Bus #</button>
                <button onClick={() => setSortBy('routeName')} className={`px-2 py-1 rounded whitespace-nowrap ${sortBy === 'routeName' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`}>Route</button>
                
                <button onClick={toggleSortDirection} className="ml-auto bg-gray-300 px-2 py-1 rounded">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                </button>
            </div>
        </div>

        {/* --- STATUS MESSAGE --- */}
        {filteredBuses.length === 0 && (
             <div className="text-center p-8 text-gray-500">
                {viewMode === 'garage' 
                    ? "No buses detected in the garage." 
                    : "No buses found matching your search."}
             </div>
        )}
        
        <div className="grid gap-3">
          {filteredBuses.map((item: any) => {
            const v = item.vehicle;
            const busNumber = v.vehicle.label || v.vehicle.id;
            const id = v.vehicle.id;
            const isSelected = selectedId === id;
            const isPinned = pinnedIds.includes(id);
            const miles = item.distanceToGarage ? item.distanceToGarage.toFixed(1) : "?";

            // GHOST CHECK (5 mins)
            const isStale = (Date.now() - item.lastUpdated) > 300000;
            // GARAGE CHECK (0.3 miles)
            const isParked = item.distanceToGarage && item.distanceToGarage <= 0.3;

            return (
              <div 
                key={id} 
                onClick={() => setSelectedId(id)}
                className={`p-3 rounded shadow cursor-pointer transition-all border-2 relative ${
                  isSelected ? "bg-blue-100 border-blue-500 scale-[1.02]" : 
                  (isStale ? "bg-gray-50 border-gray-200" : "bg-white border-transparent hover:bg-gray-50")
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
                        <div className={`font-bold text-lg ${isStale ? "text-gray-500" : "text-blue-600"}`}>
                            {isStale ? "👻 " : ""} Bus #{busNumber}
                        </div>
                        <div className="text-sm text-gray-800">Route: {item.humanRouteName || "N/A"}</div>
                        
                        {/* GARAGE BADGE */}
                        {isParked && (
                            <div className="mt-1 inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded border border-purple-200 font-bold">
                                🏠 AT GARAGE
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                            {miles} mi
                        </div>
                        {isStale && (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                Offline
                            </span>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full md:w-2/3 h-1/2 md:h-full relative z-0">
        {/* @ts-ignore */}
        <MapWithNoSSR buses={filteredBuses} selectedId={selectedId} pinnedIds={pinnedIds} />
      </div>
    </main>
  );
}