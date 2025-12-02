"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useBusData } from "../useBusData"; // Note: Assumes useBusData is up one level

// IMPORTANT: We load the map dynamically to prevent server-side errors (SSR=false)
const MapWithNoSSR = dynamic(() => import("../Map"), { 
  ssr: false,
  loading: () => <p className="p-4">Loading Map...</p>
});

export default function TrackerPage() {
  const buses = useBusData();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <main className="h-screen flex flex-col md:flex-row font-sans">
      {/* LEFT SIDE: The List */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto p-4 bg-gray-100 border-r border-gray-300">
        <h1 className="text-2xl font-bold mb-4 sticky top-0 bg-gray-100 pb-2 border-b border-gray-200">
          MARTA Tracker ({buses.length})
        </h1>
        
        {buses.length === 0 && (
            <p className="text-gray-500 italic">Waiting for bus data...</p>
        )}

        <div className="grid gap-3">
          {/* FIX: (item: any) prevents the Vercel TypeScript error */}
          {buses.map((item: any) => {
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