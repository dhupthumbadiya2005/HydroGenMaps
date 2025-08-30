import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '@/services/mapbox';
import { Card } from '@/components/ui/card';

interface ApiLocation {
  id: string;
  visibility: 'public' | 'private';
  coordinates: [number, number];
  // Additional fields that might be in the API response
  name?: string;
  address?: string;
  type?: string;
  description?: string;
  status?: string;
  // Add any other fields that might be present in the actual API response
}

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (coordinates: [number, number]) => void;
  selectedLocation?: {
    coordinates: [number, number];
    radius: number;
  } | null;
  apiLocations?: ApiLocation[];
  currentRadius?: number;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  center = [-98.5795, 39.8283], // Geographic center of US
  zoom = 4,
  onLocationSelect,
  selectedLocation,
  apiLocations = [],
  currentRadius = 10
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check if location is within radius
  const isLocationInRadius = (locationCoords: [number, number], selectedCoords: [number, number], radius: number): boolean => {
    const distance = calculateDistance(
      selectedCoords[1], // latitude
      selectedCoords[0], // longitude
      locationCoords[1], // latitude
      locationCoords[0]  // longitude
    );
    return distance <= radius;
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with placeholder token
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add attribution control
    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      }),
      'bottom-right'
    );

    // Click handler for location selection
    map.current.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      onLocationSelect?.(coordinates);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map when selected location changes
  useEffect(() => {
    if (!map.current || !selectedLocation) return;

    // Clear existing markers and layers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add marker for selected location
    new mapboxgl.Marker({
      color: '#3b82f6'
    })
      .setLngLat(selectedLocation.coordinates)
      .addTo(map.current);

    // Create and add radius circle
    const radiusInDegrees = selectedLocation.radius / 111; // Rough conversion km to degrees
    
    // Remove existing radius circle layers if they exist
    if (map.current.getLayer('radius-circle-fill')) {
      map.current.removeLayer('radius-circle-fill');
    }
    if (map.current.getLayer('radius-circle-border')) {
      map.current.removeLayer('radius-circle-border');
    }
    if (map.current.getSource('radius-circle')) {
      map.current.removeSource('radius-circle');
    }

    // Create radius circle using GeoJSON
    const circle = createCircle(selectedLocation.coordinates, radiusInDegrees);

    // Add radius circle source
    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: circle
    });

    // Add radius circle fill layer (transparent)
    map.current.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1 // Very transparent fill
      }
    });

    // Add radius circle border layer
    map.current.addLayer({
      id: 'radius-circle-border',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.6 // Semi-transparent border
      }
    });
    
    // Center map on selected location with appropriate zoom
    const zoomLevel = Math.max(8, 15 - Math.log2(selectedLocation.radius));
    map.current.flyTo({
      center: selectedLocation.coordinates,
      zoom: zoomLevel,
      duration: 2000
    });
  }, [selectedLocation]);

  // Update API locations on map
  useEffect(() => {
    if (!map.current || !selectedLocation) return;

    console.log('Updating API locations on map:', apiLocations);
    console.log('Selected location:', selectedLocation);

    // Clear existing API location markers and messages
    const apiMarkers = document.querySelectorAll('.api-location-marker');
    apiMarkers.forEach(marker => marker.remove());
    
    const noLocationsMessages = document.querySelectorAll('.no-locations-message');
    noLocationsMessages.forEach(message => message.remove());

    // Add markers for API locations
    console.log(`Processing ${apiLocations.length} API locations`);
    
    if (apiLocations.length === 0) {
      // Show a message when no locations are found
      const noLocationsElement = document.createElement('div');
      noLocationsElement.className = 'no-locations-message';
      noLocationsElement.style.position = 'absolute';
      noLocationsElement.style.top = '50%';
      noLocationsElement.style.left = '50%';
      noLocationsElement.style.transform = 'translate(-50%, -50%)';
      noLocationsElement.style.background = 'rgba(0, 0, 0, 0.7)';
      noLocationsElement.style.color = 'white';
      noLocationsElement.style.padding = '12px 20px';
      noLocationsElement.style.borderRadius = '8px';
      noLocationsElement.style.fontSize = '14px';
      noLocationsElement.style.zIndex = '1000';
      noLocationsElement.textContent = 'No locations found in this area';
      
      mapContainer.current?.appendChild(noLocationsElement);
      
      // Remove the message after 3 seconds
      setTimeout(() => {
        noLocationsElement.remove();
      }, 3000);
      
      return;
    }
    
    apiLocations.forEach((location, index) => {
      console.log(`Processing location ${index + 1}:`, location);
      
      // Validate location data
      if (!location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        console.warn(`Invalid location data at index ${index}:`, location);
        return;
      }
      
      // Validate coordinates are numbers
      const [lng, lat] = location.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
        console.warn(`Invalid coordinates at index ${index}:`, location.coordinates);
        return;
      }
      
      console.log(`Creating marker for location ${index + 1}:`, {
        id: location.id,
        name: location.name,
        coordinates: location.coordinates,
        lng: lng,
        lat: lat
      });
      
      if (location.visibility === 'public') {
        const isInRadius = isLocationInRadius(location.coordinates, selectedLocation.coordinates, selectedLocation.radius);
        
        // Create custom marker element with label
        const markerElement = document.createElement('div');
        markerElement.className = 'api-location-marker';
        markerElement.style.position = 'relative';
        markerElement.style.cursor = 'pointer';
        markerElement.style.width = '0';
        markerElement.style.height = '0';
        
        // Create the marker pin
        const pinElement = document.createElement('div');
        pinElement.style.width = '20px';
        pinElement.style.height = '20px';
        pinElement.style.borderRadius = '50% 50% 50% 0';
        pinElement.style.background = isInRadius ? '#10b981' : '#6b7280';
        pinElement.style.transform = 'rotate(-45deg)';
        pinElement.style.border = '2px solid white';
        pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        pinElement.style.position = 'absolute';
        pinElement.style.top = '-10px';
        pinElement.style.left = '-10px';
        
        // Create label element - use actual data from API response
        const labelElement = document.createElement('div');
        labelElement.style.position = 'absolute';
        labelElement.style.top = '-30px';
        labelElement.style.left = '-15px';
        labelElement.style.background = isInRadius ? '#10b981' : '#6b7280';
        labelElement.style.color = 'white';
        labelElement.style.padding = '2px 6px';
        labelElement.style.borderRadius = '4px';
        labelElement.style.fontSize = '10px';
        labelElement.style.fontWeight = 'bold';
        labelElement.style.whiteSpace = 'nowrap';
        labelElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        labelElement.style.zIndex = '1000';
        
        // Use actual data from API response for label
        const labelText = location.name || location.id || `Location ${index + 1}`;
        labelElement.textContent = labelText.length > 15 ? labelText.substring(0, 15) + '...' : labelText;
        
        // Add highlight effect for locations in radius
        if (isInRadius) {
          pinElement.style.animation = 'pulse 2s infinite';
          labelElement.style.background = '#10b981';
          labelElement.style.border = '1px solid #059669';
        }
        
        // Append elements to marker
        markerElement.appendChild(pinElement);
        markerElement.appendChild(labelElement);
        
        // Create marker with custom element
        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center' // Use center anchor for better positioning
        })
          .setLngLat(location.coordinates)
          .addTo(map.current!);
          
        // Add a temporary debug marker to verify positioning (remove this later)
        if (index === 0) { // Only for first marker
          const debugMarker = new mapboxgl.Marker({
            color: 'red',
            scale: 0.5
          })
            .setLngLat(location.coordinates)
            .addTo(map.current!);
            
          // Remove debug marker after 5 seconds
          setTimeout(() => {
            debugMarker.remove();
          }, 5000);
        }

       

        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          pinElement.style.transform = 'rotate(-45deg) scale(1.1)';
          labelElement.style.transform = 'scale(1.05)';
        });

        markerElement.addEventListener('mouseleave', () => {
          pinElement.style.transform = 'rotate(-45deg) scale(1)';
          labelElement.style.transform = 'scale(1)';
        });
      }
    });
  }, [apiLocations, selectedLocation]);

  // Helper function to create a circle GeoJSON
  const createCircle = (center: [number, number], radius: number) => {
    const points = 64; // Number of points to create the circle
    const coordinates: [number, number][] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const lat = center[1] + (radius * Math.cos(angle * Math.PI / 180));
      const lng = center[0] + (radius * Math.sin(angle * Math.PI / 180) / Math.cos(center[1] * Math.PI / 180));
      coordinates.push([lng, lat]);
    }
    
    // Close the circle
    coordinates.push(coordinates[0]);
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates]
      },
      properties: {}
    };
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        setUserLocation(coordinates);
        
        if (map.current) {
          map.current.flyTo({
            center: coordinates,
            zoom: 12
          });

          // Add user location marker
          new mapboxgl.Marker({
            color: '#ef4444'
          })
            .setLngLat(coordinates)
            .addTo(map.current);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location.');
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* Add CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
          }
        `}
      </style>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Current Location Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          onClick={getCurrentLocation}
          size="icon"
          className="bg-card hover:bg-secondary border border-border shadow-lg"
          variant="outline"
        >
          <Crosshair className="w-4 h-4" />
        </Button>
      </div>

      {/* Radius Legend */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="p-4 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg max-w-xs">
            <div className="space-y-3">
              {/* Analysis Radius */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full opacity-10"></div>
                <div className="w-3 h-3 border-2 border-primary rounded-full opacity-60"></div>
                <span className="text-xs font-medium">Analysis Radius: {selectedLocation.radius} km</span>
              </div>
              
              {/* Location Markers */}
              {apiLocations.length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Location Markers:</div>
                  
                  {/* In radius markers */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="w-4 h-4 bg-success rounded-full border-2 border-white shadow-sm"></div>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-success rounded-full text-white text-[6px] flex items-center justify-center font-bold">
                        1
                      </div>
                    </div>
                    <span className="text-xs">In radius: {apiLocations.filter(loc => 
                      isLocationInRadius(loc.coordinates, selectedLocation.coordinates, selectedLocation.radius)
                    ).length} locations</span>
                  </div>
                  
                  {/* Outside radius markers */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-gray-400 rounded-full text-white text-[6px] flex items-center justify-center font-bold">
                        2
                      </div>
                    </div>
                    <span className="text-xs">Outside radius: {apiLocations.filter(loc => 
                      !isLocationInRadius(loc.coordinates, selectedLocation.coordinates, selectedLocation.radius)
                    ).length} locations</span>
                  </div>
                  
                  {/* Instructions */}
                  <div className="text-xs text-muted-foreground pt-1">
                    Click on markers to see details
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};