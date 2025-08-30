// MODIFIED: Importing turf from a CDN-like source to resolve bundling issues
import * as turf from '@turf/turf';
import { allAssets, Asset } from '@/data/mockAssets';

// --- INTERFACES AND MOCK DATA ---

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

// This is the new type for our assets, which includes the isPrimary flag
// It also includes an optional distance property used during calculation
export type NearbyAsset = Asset & { isPrimary: boolean; distance?: number };

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

// --- API FUNCTIONS ---

export const searchLocations = async (query: string): Promise<LocationData[]> => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("Mapbox Access Token is not configured.");
    return [];
  }
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood,address,poi&limit=5&language=en`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return [];
    }
    
    return data.features.map((feature: any) => ({
      name: feature.text || feature.place_name.split(',')[0],
      coordinates: feature.center as [number, number],
      address: feature.place_name || feature.text
    }));
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export const analyzeLocation = async (location: LocationData, radius: number): Promise<AnalysisResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data combined with the actual selected location and radius
  return {
    ...mockAnalysisResult,
    location,
    radius
  };
};

// --- DUAL-RADIUS FILTERING FUNCTION ---

/**
 * Finds all assets within a large secondary radius and "tags" the ones
 * that are also within the smaller, user-selected primary radius.
 * @param centerCoordinates The [longitude, latitude] of the search center.
 * @param primaryRadiusKm The user's selected radius (e.g., 15km).
 * @param secondaryRadiusKm The larger, contextual radius (e.g., 100km).
 * @returns An array of NearbyAsset objects.
 */
export function getAssetsInDualRadius(
  centerCoordinates: [number, number],
  primaryRadiusKm: number,
  secondaryRadiusKm: number = 100
): NearbyAsset[] {
  console.log("getAssetsInDualRadius called with:", { centerCoordinates, primaryRadiusKm, secondaryRadiusKm });
  console.log("Total allAssets available:", allAssets.length);
  
  // MODIFIED: Using the imported turf object
  const centerPoint = turf.point(centerCoordinates);
  
  const result = allAssets
    // First, calculate the distance for every asset
    .map(asset => {
      const assetPoint = turf.point(asset.coordinates);
      // MODIFIED: Using the imported turf object
      const dist = turf.distance(centerPoint, assetPoint, { units: 'kilometers' });
      return { ...asset, distance: dist };
    })
    // Next, filter out any assets that are outside our larger, 100km context circle
    .filter(asset => {
      const isWithinSecondary = asset.distance! <= secondaryRadiusKm;
      if (isWithinSecondary) {
        console.log(`Asset ${asset.name} is within ${secondaryRadiusKm}km radius (distance: ${asset.distance!.toFixed(2)}km)`);
      }
      return isWithinSecondary;
    })
    // Finally, map over the remaining assets and add the 'isPrimary' flag
    .map(asset => {
      const isPrimary = asset.distance! <= primaryRadiusKm;
      console.log(`Asset ${asset.name}: isPrimary=${isPrimary}, distance=${asset.distance!.toFixed(2)}km`);
      return {
        ...asset,
        isPrimary
      };
    });

  console.log("Final filtered assets:", result.length);
  console.log("Primary assets:", result.filter(a => a.isPrimary).length);
  console.log("Secondary assets:", result.filter(a => !a.isPrimary).length);
  
  return result;
}