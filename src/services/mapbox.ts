// Mapbox configuration and utilities
 // To be replaced with actual token
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
export interface LocationData {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

export interface AnalysisResult {
  location: LocationData;
  radius: number;
  recommendations: string[];
  score: number;
}

// Mock data for demonstration
export const mockAnalysisResult: AnalysisResult = {
  location: {
    name: "Sample Location",
    coordinates: [-74.006, 40.7128],
    address: "New York, NY, USA"
  },
  radius: 10,
  recommendations: [
    "High renewable energy potential in this area",
    "Good access to industrial demand centers", 
    "Favorable regulatory environment",
    "Adequate water resources available"
  ],
  score: 85
};

export const searchLocations = async (query: string): Promise<LocationData[]> => {
  try {
    // Use Mapbox Geocoding API to get real coordinates
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood,address,poi&limit=5&language=en`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      // Try a broader search if no results found
      const broaderUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&language=en`;
      const broaderResponse = await fetch(broaderUrl);
      
      if (broaderResponse.ok) {
        const broaderData = await broaderResponse.json();
        if (broaderData.features && broaderData.features.length > 0) {
          return broaderData.features.map((feature: any) => ({
            name: feature.text || feature.place_name.split(',')[0],
            coordinates: feature.center as [number, number],
            address: feature.place_name || feature.text
          }));
        }
      }
      
      // Fallback to mock data if no results found
      return [
        {
          name: query,
          coordinates: [-74.006, 40.7128],
          address: `${query}, Location not found`
        }
      ];
    }
    
    // Transform Mapbox features to LocationData format
    return data.features.map((feature: any) => ({
      name: feature.text || feature.place_name.split(',')[0],
      coordinates: feature.center as [number, number], // [longitude, latitude]
      address: feature.place_name || feature.text
    }));
    
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback to mock data if API fails
    return [
      {
        name: query,
        coordinates: [-74.006, 40.7128],
        address: `${query}, API Error - Using fallback location`
      }
    ];
  }
};

export const analyzeLocation = async (location: LocationData, radius: number): Promise<AnalysisResult> => {
  // Placeholder implementation - to be replaced with actual analysis API
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate analysis time
  
  return {
    ...mockAnalysisResult,
    location,
    radius
  };
};