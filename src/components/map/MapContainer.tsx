import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '@/services/mapbox';

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

    // Add radius circle (simplified - in real implementation would use proper GeoJSON)
    const radiusInDegrees = selectedLocation.radius / 111; // Rough conversion km to degrees
    
    // Center map on selected location
    map.current.flyTo({
      center: selectedLocation.coordinates,
      zoom: Math.max(10, 15 - selectedLocation.radius / 5)
    });
  }, [selectedLocation]);

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

      {/* Placeholder overlay when no token */}
      {MAPBOX_ACCESS_TOKEN === 'placeholder-mapbox-token' && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-20 rounded-lg">
          <div className="bg-card p-6 rounded-lg shadow-lg text-center max-w-sm">
            <h3 className="font-semibold mb-2">Map Integration</h3>
            <p className="text-sm text-muted-foreground">
              Mapbox integration ready. Replace placeholder token with your actual Mapbox access token to enable full functionality.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};