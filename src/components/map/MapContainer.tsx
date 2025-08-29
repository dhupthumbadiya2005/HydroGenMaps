import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '@/services/mapbox';
import { Card } from '@/components/ui/card';

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (coordinates: [number, number]) => void;
  selectedLocation?: {
    coordinates: [number, number];
    radius: number;
  } | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  center = [-98.5795, 39.8283], // Geographic center of US
  zoom = 4,
  onLocationSelect,
  selectedLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
          <Card className="p-3 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full opacity-10"></div>
              <div className="w-3 h-3 border-2 border-primary rounded-full opacity-60"></div>
              <span className="text-xs font-medium">Analysis Radius: {selectedLocation.radius} km</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};