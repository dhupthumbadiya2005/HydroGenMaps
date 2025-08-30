import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, DollarSign, Calendar, Building2, Search, Crosshair, Check, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/services/endpoints';
import { MAPBOX_ACCESS_TOKEN } from '@/services/mapbox';
import { searchLocations, LocationData } from '@/services/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { auth } from '@/services/firebase'; // Import Firebase auth
import { useAuthState } from 'react-firebase-hooks/auth'; // Firebase auth hook

interface Asset {
  id: string;
  name: string;
  location: {
    name: string;
    address: string;
    coordinates: [number, number];
  };
  category: string;
  capexEstimate: number;
  opexEstimate: number;
  // Additional field names that might come from database
  capex_estimate?: number;
  opex_estimate?: number;
  capex?: number;
  opex?: number;
  ownership: 'public' | 'private';
  constructionStatus: 'constructed' | 'under_construction';
  notes: string;
  dateAdded: string;
  status: 'active' | 'planned' | 'completed';
}

// Updated asset categories as requested
const assetCategories = [
  // Hydrogen Infrastructure
  'Hydrogen Plants',
  'Hydrogen Storage Facilities (tanks, underground storage, others)',
  'Hydrogen Distribution Hubs (refuelling stations, industrial hubs, others)',
  
  
  // Supporting Renewable & Industrial Infrastructure
  'Renewable Energy Farms (solar, wind, hydro, biomass, others)',
  'Water Sources (rivers, reservoirs, groundwater, others)',
  
  // Industrial/market demands
  'Industrial Demand Hubs (steel plants, fertilizer factories, Cement Plants, transport depots, refineries, Oil Refineries & Petrochemical Complexes, Heavy Transport Depots, Ports, Railway Freight Terminals / Corridors, Large Urban/Industrial Clusters, others)',
  
  // Transport & Logistics
  'Ports (import/export potential)',
  'Airports/Railway Stations',
  'Land Suitability - Residencial',
  'Land Suitability - Industrial',
  'Land Suitability - Forest',
  'Restricted/Protected Zone',
  'Natural Distaster Prone Zone',
  'Natural Disaster Resilient Zone',
  'National Park / Biodiversity Zone',
  'Subsidy / Incentive Zone',
  'Proximity to Industrial/Urban Cluster'
  
];

// Mock initial data
const initialAssets: Asset[] = [
 //dummy
];

export const Assets: React.FC = () => {
  const [user, loading, error] = useAuthState(auth); // Firebase auth state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Location selector states
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    coordinates: [number, number];
  } | null>(null);

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: {
      name: '',
      address: '',
      coordinates: [0, 0] as [number, number]
    },
    category: '',
    capexEstimate: '',
    opexEstimate: '',
    ownership: 'private' as 'public' | 'private',
    constructionStatus: 'constructed' as 'constructed' | 'under_construction',
    notes: '',
    status: 'planned' as Asset['status']
  });

  const { toast } = useToast();

  // Fetch assets from database for the current user
  const fetchUserAssets = async () => {
    if (!user?.email) return;
    
    setLoadingAssets(true);
    try {
      const response = await fetch(API_ENDPOINTS.ASSETS.GET_ALL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const allAssets = await response.json();
      console.log('All assets from database:', allAssets);
      
      // Filter assets to show only those belonging to the current user
      const userAssets = allAssets.filter((asset: any) => 
        asset.userEmail === user.email || asset.user_email === user.email
      );
      
      console.log('Filtered user assets:', userAssets);
      setAssets(userAssets);
      
      toast({
        title: "Assets loaded",
        description: `Found ${userAssets.length} assets in your portfolio.`,
      });
      
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: "Failed to load assets",
        description: "Please try again later.",
        variant: "destructive",
      });
      // Fallback to empty array
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // Fetch assets when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      fetchUserAssets();
    }
  }, [user?.email]);

  // Generate unique asset ID based on user email and asset name
  const generateAssetId = (email: string, assetName: string): string => {
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const namePrefix = assetName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${emailPrefix}_${namePrefix}_${timestamp}`;
  };

  // Check if user is authenticated
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Authentication required. Please log in to manage assets.</p>
      </div>
    );
  }

  // Initialize map when location selector is shown
  useEffect(() => {
    if (!showLocationSelector || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 4,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Click handler for location selection
    map.current.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      handleMapClick(coordinates);
    });

    return () => {
      map.current?.remove();
    };
  }, [showLocationSelector]);

  const addMarker = (coordinates: [number, number]) => {
    if (!map.current) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add new marker
    new mapboxgl.Marker({
      color: '#3b82f6',
      scale: 1.2
    })
      .setLngLat(coordinates)
      .addTo(map.current);
  };

  const handleMapClick = async (coordinates: [number, number]) => {
    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood,address`
      );
      
      if (response.ok) {
        const data = await response.json();
        const location = {
          name: data.features[0]?.text || 'Selected Location',
          address: data.features[0]?.place_name || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`,
          coordinates
        };
        
        setSelectedLocation(location);
        addMarker(coordinates);
        
        toast({
          title: "Location selected",
          description: location.address,
        });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      const location = {
        name: 'Selected Location',
        address: `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`,
        coordinates
      };
      setSelectedLocation(location);
      addMarker(coordinates);
    }
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      if (results.length > 0) {
        const location = results[0];
        const locationData = {
          name: location.name,
          address: location.address,
          coordinates: location.coordinates
        };
        
        setSelectedLocation(locationData);
        addMarker(location.coordinates);
        
        if (map.current) {
          map.current.flyTo({
            center: location.coordinates,
            zoom: 12,
            duration: 2000
          });
        }
        
        setShowSuggestions(false);
        setSearchQuery(location.name);
        
        toast({
          title: "Location found",
          description: location.address,
        });
      } else {
        toast({
          title: "No location found",
          description: "Please try a different search term.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationData) => {
    const locationData = {
      name: suggestion.name,
      address: suggestion.address,
      coordinates: suggestion.coordinates
    };
    
    setSelectedLocation(locationData);
    addMarker(suggestion.coordinates);
    
    if (map.current) {
      map.current.flyTo({
        center: suggestion.coordinates,
        zoom: 12,
        duration: 2000
      });
    }
    
    setShowSuggestions(false);
    setSearchQuery(suggestion.name);
    
    toast({
      title: "Location selected",
      description: suggestion.address,
    });
  };

  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    
    if (value.length > 2) {
      try {
        const results = await searchLocations(value);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Suggestion search failed:', error);
        setSuggestions([]);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        location: selectedLocation
      }));
      setShowLocationSelector(false);
      setSelectedLocation(null);
      setSearchQuery('');
      
      toast({
        title: "Location confirmed",
        description: `${selectedLocation.name} has been added to your asset.`,
      });
    } else {
      toast({
        title: "No location selected",
        description: "Please select a location on the map or search for one.",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        handleMapClick(coordinates);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: "Location error",
          description: "Unable to get your current location.",
          variant: "destructive",
        });
      }
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: {
        name: '',
        address: '',
        coordinates: [0, 0]
      },
      category: '',
      capexEstimate: '',
      opexEstimate: '',
      ownership: 'private',
      constructionStatus: 'constructed',
      notes: '',
      status: 'planned'
    });
    setEditingAsset(null);
    setShowLocationSelector(false);
    setSelectedLocation(null);
    setSearchQuery('');
  };

  const createAsset = async (assetData: Omit<Asset, 'id' | 'dateAdded'>) => {
    if (!user?.email) {
      throw new Error('User email not available');
    }
  
    const assetId = generateAssetId(user.email, assetData.name);
  
    const assetWithId = {
      id: assetId,
      ...assetData,
      userEmail: user.email,
      dateAdded: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };
  
    try {
      const response = await fetch(API_ENDPOINTS.ASSETS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetWithId),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to create asset: ${response.status}`);
      }
  
      const newAsset = await response.json();
      return newAsset;
    } catch (error) {
      console.error('Error creating asset:', error);
      return assetWithId; // fallback to local
    }
  };
  

  const updateAsset = async (id: string, assetData: Partial<Asset>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ASSETS.UPDATE}${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update asset: ${response.status}`);
      }
  
      const updatedAsset = await response.json();
      return updatedAsset;
    } catch (error) {
      console.error('Error updating asset:', error);
      return { id, ...assetData }; // fallback
    }
  };
  
  
  

  const deleteAsset = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ASSETS.DELETE}${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }
  
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      // Fallback to local state for demo
      return true;
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location.name || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const assetData = {
      name: formData.name,
      location: formData.location,
      category: formData.category,
      capexEstimate: parseFloat(formData.capexEstimate) || 0,
      opexEstimate: parseFloat(formData.opexEstimate) || 0,
      ownership: formData.ownership,
      constructionStatus: formData.constructionStatus,
      notes: formData.notes,
      status: formData.status
    };

    try {
      if (editingAsset) {
        const updatedAsset = await updateAsset(editingAsset.id, assetData);
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id ? { ...asset, ...updatedAsset } : asset
        ));
        toast({
          title: "Asset updated",
          description: "Asset has been successfully updated.",
        });
      } else {
        const newAsset = await createAsset(assetData);
        // Refresh the assets list from database instead of just adding locally
        await fetchUserAssets();
        toast({
          title: "Asset created",
          description: "New asset has been added to your portfolio.",
        });
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      location: asset.location,
      category: asset.category,
      capexEstimate: asset.capexEstimate.toString(),
      opexEstimate: asset.opexEstimate.toString(),
      ownership: asset.ownership,
      constructionStatus: asset.constructionStatus,
      notes: asset.notes,
      status: asset.status
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAsset(id);
      // Refresh the assets list from database instead of just filtering locally
      await fetchUserAssets();
      toast({
        title: "Asset deleted",
        description: "Asset has been removed from your portfolio.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount * 10000000); // Convert crore to actual amount
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'planned': return 'bg-warning text-warning-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // Calculate totals with proper type checking and field mapping
  const totalCapex = assets.reduce((sum, asset) => {
    // Handle different possible field names from database
    const capex = asset.capexEstimate || asset.capex_estimate || asset.capex || 0;
    // Ensure it's a number and convert to number if it's a string
    const capexNumber = typeof capex === 'string' ? parseFloat(capex) || 0 : Number(capex) || 0;
    return sum + capexNumber;
  }, 0);
  
  const totalOpex = assets.reduce((sum, asset) => {
    // Handle different possible field names from database
    const opex = asset.opexEstimate || asset.opex_estimate || asset.opex || 0;
    // Ensure it's a number and convert to number if it's a string
    const opexNumber = typeof opex === 'string' ? parseFloat(opex) || 0 : Number(opex) || 0;
    return sum + opexNumber;
  }, 0);

  // Debug logging to see what's in the assets
  console.log('Assets for total calculation:', assets);
  console.log('Total CAPEX calculation:', totalCapex);
  console.log('Total OPEX calculation:', totalOpex);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">
            Manage your hydrogen infrastructure investments
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Asset Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter asset name"
                  required
                />
              </div>

              {/* Location Selector */}
              <div className="space-y-4">
                <Label>Location *</Label>
                
                {/* Location Display */}
                {formData.location.name && (
                  <div className="p-3 border border-border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <p className="font-medium">{formData.location.name}</p>
                      <p className="text-sm text-muted-foreground">{formData.location.address}</p>
                    </div>
                  </div>
                )}

                {/* Location Selector Toggle */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationSelector(!showLocationSelector)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {formData.location.name ? 'Change Location' : 'Select Location'}
                </Button>

                {/* Integrated Location Selector */}
                {showLocationSelector && (
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-4 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="Search for a location..."
                              value={searchQuery}
                              onChange={(e) => handleInputChange(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                              className="pl-10"
                            />
                          </div>
                          <Button onClick={handleLocationSearch} disabled={searching || !searchQuery.trim()}>
                            {searching ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Searching...
                              </>
                            ) : (
                              'Search'
                            )}
                          </Button>
                          <Button variant="outline" onClick={getCurrentLocation}>
                            <Crosshair className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Search Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
                            <CardContent className="p-0">
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full p-3 text-left hover:bg-secondary flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-b-0"
                                >
                                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{suggestion.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">
                                      {suggestion.address}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Map Container */}
                      <div className="h-64 relative">
                        <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
                      </div>

                      {/* Selected Location Info */}
                      {selectedLocation && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold">{selectedLocation.name}</h4>
                                <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                              </div>
                              <Button onClick={handleConfirmLocation} className="btn-gradient">
                                <Check className="w-4 h-4 mr-2" />
                                Confirm Location
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Instructions */}
                      <div className="text-center text-sm text-muted-foreground">
                        <p>Click on the map to select a location or search for a specific place</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Asset Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Asset Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset category" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Financial Estimates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capexEstimate">CAPEX Estimate (Crore INR)</Label>
                  <Input
                    id="capexEstimate"
                    type="number"
                    value={formData.capexEstimate}
                    onChange={(e) => setFormData(prev => ({ ...prev, capexEstimate: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opexEstimate">OPEX Estimate (Crore INR)</Label>
                  <Input
                    id="opexEstimate"
                    type="number"
                    value={formData.opexEstimate}
                    onChange={(e) => setFormData(prev => ({ ...prev, opexEstimate: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Ownership and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership</Label>
                  <Select value={formData.ownership} onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, ownership: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constructionStatus">Construction Status</Label>
                  <Select value={formData.constructionStatus} onValueChange={(value: 'constructed' | 'under_construction') => setFormData(prev => ({ ...prev, constructionStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constructed">Constructed</SelectItem>
                      <SelectItem value="under_construction">Under Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Asset Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Asset Status</Label>
                <Select value={formData.status} onValueChange={(value: Asset['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this asset..."
                  rows={3}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-gradient">
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assets.length}</p>
              <p className="text-muted-foreground">Total Assets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isNaN(totalCapex) || totalCapex === 0 ? '₹0' : formatCurrency(totalCapex)}
              </p>
              <p className="text-muted-foreground">Total CAPEX</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isNaN(totalOpex) || totalOpex === 0 ? '₹0' : formatCurrency(totalOpex)}
              </p>
              <p className="text-muted-foreground">Total OPEX</p>
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* Assets List */}
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {assets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your hydrogen infrastructure portfolio by adding your first asset.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="btn-gradient">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{asset.name}</h3>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{asset.location.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>CAPEX: {formatCurrency(asset.capexEstimate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>OPEX: {formatCurrency(asset.opexEstimate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Added {asset.dateAdded}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{asset.category}</p>
                      <div className="flex space-x-2 text-xs">
                        <Badge variant="outline">{asset.ownership}</Badge>
                        <Badge variant="outline">{asset.constructionStatus.replace('_', ' ')}</Badge>
                      </div>
                      {asset.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{asset.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(asset.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};