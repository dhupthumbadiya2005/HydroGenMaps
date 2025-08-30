import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Crosshair, Check, X, Loader2 } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '@/services/mapbox';
import { searchLocations, LocationData } from '@/services/mapbox';
import { useToast } from '@/hooks/use-toast';

interface LocationSelectorProps {
  onLocationSelect: (location: {
    name: string;
    address: string;
    coordinates: [number, number];
  }) => void;
  onClose: () => void;
  initialLocation?: {
    name: string;
    address: string;
    coordinates: [number, number];
  };
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  onClose,
  initialLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    coordinates: [number, number];
  } | null>(initialLocation || null);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialLocation?.coordinates || [-98.5795, 39.8283],
      zoom: initialLocation ? 12 : 4,
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

    // Add initial marker if location is provided
    if (initialLocation) {
      addMarker(initialLocation.coordinates);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const addMarker = (coordinates: [number, number]) => {
    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add new marker
    new mapboxgl.Marker({
      color: '#3b82f6',
      scale: 1.2
    })
      .setLngLat(coordinates)
      .addTo(map.current!);
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

  const handleSearch = async () => {
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
        setSearchQuery(location.name); // Keep the search query for user reference
        
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

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col animate-scale-in">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle>Select Location</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive hover:text-destructive-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
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
          <div className="flex-1 relative">
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
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {selectedLocation.coordinates[1].toFixed(4)}, {selectedLocation.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                  <Button onClick={handleConfirm} className="btn-gradient">
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
    </div>
  );
};
