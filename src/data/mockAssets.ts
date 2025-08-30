// @/data/mockAssets.ts

export interface Asset {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  capacity?: string;
  status?: string;
  description?: string;
}

// Sample hydrogen assets data - You can replace this with your actual data
export const allAssets: Asset[] = [
  // Assets around Ahmedabad, India (Close - within various radius ranges)
  {
    id: "ahd-1",
    name: "Gujarat Green Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [72.5714, 23.0225], // Near Ahmedabad - ~0km
    capacity: "50 MW",
    status: "Operational",
    description: "Large-scale green hydrogen production facility"
  },
  {
    id: "ahd-2",
    name: "Gandhinagar Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [72.6369, 23.2156], // Gandhinagar - ~23km
    capacity: "5 MW",
    status: "Under Construction",
    description: "Public hydrogen refueling station"
  },
  {
    id: "ahd-3",
    name: "GIDC Hydrogen Plant",
    type: "Industrial Hydrogen Plant",
    coordinates: [72.4569, 23.0693], // Ahmedabad GIDC - ~8km
    capacity: "25 MW",
    status: "Operational",
    description: "Industrial hydrogen production for local industries"
  },
  {
    id: "ahd-4",
    name: "Anand Hydrogen Facility",
    type: "Hydrogen Production Plant",
    coordinates: [72.9551, 22.5645], // Anand - ~50km
    capacity: "20 MW",
    status: "Planned",
    description: "Regional hydrogen production facility"
  },
  {
    id: "ahd-5",
    name: "Kalol Industrial Hydrogen",
    type: "Industrial Hydrogen Plant",
    coordinates: [72.4967, 23.2167], // Kalol - ~25km
    capacity: "15 MW",
    status: "Under Construction",
    description: "Industrial hydrogen for chemical sector"
  },
  
  // Assets at 60-100km range (These should show as RED dots when radius < 60km)
  {
    id: "guj-1",
    name: "Vadodara Green Energy",
    type: "Hydrogen Production Plant",
    coordinates: [73.2081, 22.3072], // Vadodara - ~85km
    capacity: "30 MW",
    status: "Planned",
    description: "Future green hydrogen facility"
  },
  {
    id: "guj-2",
    name: "Rajkot Hydrogen Hub",
    type: "Hydrogen Storage Facility",
    coordinates: [70.7833, 22.3039], // Rajkot - ~95km
    capacity: "15 MW",
    status: "Under Construction",
    description: "Regional hydrogen storage and distribution"
  },
  {
    id: "guj-3",
    name: "Bharuch Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [72.9900, 21.7051], // Bharuch - ~75km
    capacity: "40 MW",
    status: "Operational",
    description: "Coastal hydrogen production facility"
  },
  {
    id: "guj-4",
    name: "Mehsana Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [72.3693, 23.5880], // Mehsana - ~65km
    capacity: "8 MW",
    status: "Operational",
    description: "North Gujarat hydrogen refueling"
  },
  {
    id: "guj-5",
    name: "Surendranagar Energy Hub",
    type: "Hydrogen Production Plant",
    coordinates: [71.6833, 22.7333], // Surendranagar - ~90km
    capacity: "35 MW",
    status: "Under Construction",
    description: "Central Gujarat hydrogen facility"
  },
  {
    id: "guj-6",
    name: "Nadiad Hydrogen Center",
    type: "Industrial Hydrogen Plant",
    coordinates: [72.8617, 22.6939], // Nadiad - ~60km
    capacity: "18 MW",
    status: "Planned",
    description: "Industrial hydrogen for agriculture sector"
  },
  {
    id: "guj-7",
    name: "Godhra Renewable Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [73.6133, 22.7756], // Godhra - ~85km
    capacity: "25 MW",
    status: "Under Construction",
    description: "Renewable energy based hydrogen production"
  },
  {
    id: "guj-8",
    name: "Palanpur Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [72.4244, 24.1667], // Palanpur - ~95km
    capacity: "6 MW",
    status: "Planned",
    description: "North Gujarat hydrogen refueling"
  },
  {
    id: "guj-9",
    name: "Bhavnagar Coastal Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [72.1519, 21.7645], // Bhavnagar - ~95km
    capacity: "45 MW",
    status: "Operational",
    description: "Coastal hydrogen production with port access"
  },
  {
    id: "guj-10",
    name: "Himmatnagar Green Hub",
    type: "Hydrogen Storage Facility",
    coordinates: [72.9683, 23.5989], // Himmatnagar - ~70km
    capacity: "12 MW",
    status: "Under Construction",
    description: "Regional hydrogen storage facility"
  },
  
  // Global assets for testing in different locations
  {
    id: "us-1",
    name: "California Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [-118.2437, 34.0522], // Los Angeles
    capacity: "100 MW",
    status: "Operational",
    description: "Large-scale hydrogen production in California"
  },
  {
    id: "us-2",
    name: "Texas Green Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [-95.3698, 29.7604], // Houston
    capacity: "75 MW",
    status: "Under Construction",
    description: "Texas renewable hydrogen facility"
  },
  {
    id: "us-3",
    name: "Florida Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [-80.1918, 25.7617], // Miami
    capacity: "55 MW",
    status: "Planned",
    description: "Southeast US hydrogen production"
  },
  {
    id: "us-4",
    name: "New York Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [-74.0060, 40.7128], // New York
    capacity: "10 MW",
    status: "Operational",
    description: "Urban hydrogen refueling in NYC"
  },
  
  // European assets
  {
    id: "eu-1",
    name: "Amsterdam Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [4.9041, 52.3676], // Amsterdam
    capacity: "60 MW",
    status: "Operational",
    description: "European hydrogen production facility"
  },
  {
    id: "eu-2",
    name: "Berlin Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [13.4050, 52.5200], // Berlin
    capacity: "10 MW",
    status: "Operational",
    description: "Public hydrogen refueling in Berlin"
  },
  {
    id: "eu-3",
    name: "Rotterdam Port Hydrogen",
    type: "Hydrogen Storage Facility",
    coordinates: [4.4777, 51.9244], // Rotterdam
    capacity: "80 MW",
    status: "Under Construction",
    description: "Major European hydrogen port facility"
  },
  
  // Asian assets
  {
    id: "jp-1",
    name: "Tokyo Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [139.6917, 35.6895], // Tokyo
    capacity: "40 MW",
    status: "Operational",
    description: "Urban hydrogen production facility"
  },
  {
    id: "jp-2",
    name: "Osaka Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [135.5023, 34.6937], // Osaka
    capacity: "35 MW",
    status: "Under Construction",
    description: "Industrial hydrogen production in Osaka"
  },
  
  // More assets around major Indian cities
  {
    id: "del-1",
    name: "Delhi Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [77.2090, 28.6139], // Delhi
    capacity: "80 MW",
    status: "Planned",
    description: "National capital region hydrogen facility"
  },
  {
    id: "del-2",
    name: "Gurgaon Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [77.0266, 28.4595], // Gurgaon
    capacity: "12 MW",
    status: "Under Construction",
    description: "NCR hydrogen refueling facility"
  },
  {
    id: "del-3",
    name: "Noida Industrial Hydrogen",
    type: "Industrial Hydrogen Plant",
    coordinates: [77.3910, 28.5355], // Noida
    capacity: "20 MW",
    status: "Operational",
    description: "Industrial hydrogen for manufacturing"
  },
  
  {
    id: "mum-1",
    name: "Mumbai Green Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [72.8777, 19.0760], // Mumbai
    capacity: "65 MW",
    status: "Under Construction",
    description: "Western India hydrogen production"
  },
  {
    id: "mum-2",
    name: "Pune Hydrogen Center",
    type: "Hydrogen Production Plant",
    coordinates: [73.8567, 18.5204], // Pune
    capacity: "45 MW",
    status: "Operational",
    description: "Maharashtra hydrogen production"
  },
  {
    id: "mum-3",
    name: "Navi Mumbai Hydrogen Hub",
    type: "Hydrogen Storage Facility",
    coordinates: [73.0297, 19.0330], // Navi Mumbai
    capacity: "25 MW",
    status: "Planned",
    description: "Regional hydrogen storage"
  },
  
  {
    id: "ban-1",
    name: "Bangalore Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [77.5946, 12.9716], // Bangalore
    capacity: "8 MW",
    status: "Operational",
    description: "South India hydrogen refueling"
  },
  {
    id: "ban-2",
    name: "Mysore Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [76.6394, 12.2958], // Mysore
    capacity: "30 MW",
    status: "Under Construction",
    description: "Karnataka hydrogen production"
  },
  
  {
    id: "hyd-1",
    name: "Hyderabad Hydrogen Plant",
    type: "Industrial Hydrogen Plant",
    coordinates: [78.4867, 17.3850], // Hyderabad
    capacity: "45 MW",
    status: "Operational",
    description: "Industrial hydrogen for pharmaceutical sector"
  },
  {
    id: "hyd-2",
    name: "Warangal Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [79.5941, 17.9689], // Warangal
    capacity: "22 MW",
    status: "Planned",
    description: "Telangana hydrogen facility"
  },
  
  {
    id: "che-1",
    name: "Chennai Coastal Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [80.2707, 13.0827], // Chennai
    capacity: "55 MW",
    status: "Under Construction",
    description: "Coastal hydrogen production facility"
  },
  {
    id: "che-2",
    name: "Coimbatore Hydrogen Center",
    type: "Hydrogen Production Plant",
    coordinates: [76.9558, 11.0168], // Coimbatore
    capacity: "28 MW",
    status: "Operational",
    description: "Tamil Nadu hydrogen production"
  },
  
  // More Gujarat assets at various distances from Ahmedabad
  {
    id: "guj-11",
    name: "Surat Diamond Hydrogen",
    type: "Industrial Hydrogen Plant",
    coordinates: [72.8311, 21.1702], // Surat - ~65km
    capacity: "22 MW",
    status: "Operational",
    description: "Hydrogen for diamond and textile industries"
  },
  {
    id: "guj-12",
    name: "Jamnagar Refinery Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [70.0668, 22.4707], // Jamnagar - ~85km
    capacity: "100 MW",
    status: "Operational",
    description: "Large refinery-based hydrogen production"
  },
  {
    id: "guj-13",
    name: "Morbi Industrial Hydrogen",
    type: "Industrial Hydrogen Plant",
    coordinates: [70.8373, 22.8197], // Morbi - ~75km
    capacity: "18 MW",
    status: "Under Construction",
    description: "Ceramic industry hydrogen supply"
  },
  {
    id: "guj-14",
    name: "Vapi Chemical Hydrogen",
    type: "Industrial Hydrogen Plant",
    coordinates: [72.9050, 20.3711], // Vapi - ~90km
    capacity: "32 MW",
    status: "Operational",
    description: "Chemical industry hydrogen production"
  },
  {
    id: "guj-15",
    name: "Gandhidham Port Hydrogen",
    type: "Hydrogen Storage Facility",
    coordinates: [70.1333, 23.0833], // Gandhidham - ~88km
    capacity: "28 MW",
    status: "Planned",
    description: "Port-based hydrogen storage and export"
  },
  {
    id: "guj-16",
    name: "Dahod Green Hydrogen",
    type: "Hydrogen Production Plant",
    coordinates: [74.2533, 22.8342], // Dahod - ~95km
    capacity: "20 MW",
    status: "Under Construction",
    description: "Tribal area hydrogen development"
  },
  {
    id: "guj-17",
    name: "Porbandar Coastal Hub",
    type: "Hydrogen Production Plant",
    coordinates: [69.6293, 21.6417], // Porbandar - ~98km
    capacity: "35 MW",
    status: "Planned",
    description: "Coastal hydrogen with renewable integration"
  },
  {
    id: "guj-18",
    name: "Junagadh Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [70.4579, 21.5222], // Junagadh - ~92km
    capacity: "26 MW",
    status: "Under Construction",
    description: "Saurashtra region hydrogen facility"
  },
  
  // Rajasthan assets (some within 100km of Ahmedabad)
  {
    id: "raj-1",
    name: "Mount Abu Hydrogen Station",
    type: "Hydrogen Refueling Station",
    coordinates: [72.7081, 24.5925], // Mount Abu - ~95km
    capacity: "5 MW",
    status: "Planned",
    description: "Hill station hydrogen refueling"
  },
  {
    id: "raj-2",
    name: "Abu Road Hydrogen Hub",
    type: "Hydrogen Production Plant",
    coordinates: [72.7819, 24.4821], // Abu Road - ~88km
    capacity: "30 MW",
    status: "Under Construction",
    description: "Rajasthan border hydrogen facility"
  },
  
  // Madhya Pradesh assets (some within 100km)
  {
    id: "mp-1",
    name: "Ratlam Hydrogen Plant",
    type: "Hydrogen Production Plant",
    coordinates: [75.0367, 23.3315], // Ratlam - ~98km
    capacity: "24 MW",
    status: "Planned",
    description: "Central India hydrogen production"
  }
];

// Helper function to get assets by type
export const getAssetsByType = (type: string): Asset[] => {
  return allAssets.filter(asset => asset.type === type);
};

// Helper function to get assets by status
export const getAssetsByStatus = (status: string): Asset[] => {
  return allAssets.filter(asset => asset.status === status);
};

// Asset types available
export const ASSET_TYPES = [
  "Hydrogen Production Plant",
  "Hydrogen Refueling Station",
  "Industrial Hydrogen Plant",
  "Hydrogen Storage Facility"
];

// Asset statuses available
export const ASSET_STATUSES = [
  "Operational",
  "Under Construction",
  "Planned"
];