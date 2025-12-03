import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Fetch from the Legacy JSON API (The one MARTA Labs likely uses)
    // This feed often includes "Out of Service" movements
    const response = await fetch("https://developer.itsmarta.com/BRDRestService/RestBusRealTimeService/GetAllBus", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`MARTA API Error: ${response.status}`);
    }

    // 2. Get the raw JSON list
    const legacyData = await response.json();

    // 3. TRANSFORM IT to look like the Modern format your app expects
    // We map the old CAPITALIZED keys to the new structure
    const convertedEntities = legacyData.map((bus) => {
      return {
        vehicle: {
          vehicle: {
            id: bus.VEHICLE,      // "1841"
            label: bus.VEHICLE    // "1841"
          },
          position: {
            latitude: parseFloat(bus.LATITUDE),
            longitude: parseFloat(bus.LONGITUDE),
            bearing: parseInt(bus.DIRECTION) || 0 // Sometimes directional
          },
          trip: {
            // The Legacy feed gives the REAL name (e.g. "110") directly!
            // This is actually better than the IDs we had before.
            routeId: bus.ROUTE,   
            tripId: bus.TRIPID
          },
          timestamp: Date.now() // Legacy feed doesn't always have time, so we stamp it now
        }
      };
    });

    // 4. Return it in the wrapper your app expects
    return NextResponse.json({
      header: { timestamp: Math.floor(Date.now() / 1000) },
      entity: convertedEntities
    });

  } catch (error) {
    console.error("Legacy API Error:", error);
    return NextResponse.json({ error: "Failed to fetch legacy buses" }, { status: 500 });
  }
}