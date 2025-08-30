import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN, NearbyAsset } from '../../services/mapbox';
import { Card } from '@/components/ui/card';
import * as turf from '@turf/turf';

interface MapContainerProps {
  center: [number, number];
  zoom: number;
  onMapMove: (center: [number, number], zoom: number) => void;
  selectedLocation: {
    coordinates: [number, number];
    radius: number;
  } | null;
  assets: NearbyAsset[];
}

export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  onMapMove,
  selectedLocation,
  assets
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // --- 1. INITIAL MAP SETUP & MOVE HANDLER ---
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error("VITE_MAPBOX_ACCESS_TOKEN is not set.");
      return;
    }
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: zoom,
      attributionControl: false,
    });
    map.current = mapInstance;

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    
    mapInstance.on('moveend', () => {
      const { lng, lat } = mapInstance.getCenter();
      onMapMove([lng, lat], mapInstance.getZoom());
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Effect to fly to a new center when it changes from search
  useEffect(() => {
    if (map.current) {
        const mapCenter = map.current.getCenter();
        if (mapCenter.lng.toFixed(4) !== center[0].toFixed(4) || mapCenter.lat.toFixed(4) !== center[1].toFixed(4)) {
            map.current.flyTo({ center, zoom, duration: 1500 });
        }
    }
  }, [center, zoom]);

  // --- 2. DRAW SELECTED LOCATION AND RADIUS ---
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const drawRadius = () => {
      if (mapInstance.getLayer('radius-circle-fill')) mapInstance.removeLayer('radius-circle-fill');
      if (mapInstance.getLayer('radius-circle-border')) mapInstance.removeLayer('radius-circle-border');
      if (mapInstance.getSource('radius-circle')) mapInstance.removeSource('radius-circle');

      if (selectedLocation) {
        const circle = turf.circle(selectedLocation.coordinates, selectedLocation.radius, { steps: 64, units: 'kilometers' });
        mapInstance.addSource('radius-circle', { type: 'geojson', data: circle });
        
        mapInstance.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 }
        });
        mapInstance.addLayer({
          id: 'radius-circle-border',
          type: 'line',
          source: 'radius-circle',
          paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-opacity': 0.7 }
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      drawRadius();
    } else {
      mapInstance.on('style.load', drawRadius);
    }
  }, [selectedLocation]);

  // --- 3. DRAW ASSETS WITH DUAL-COLORING AND POPUPS ---
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    console.log("Adding assets to map:", assets);

    const addAssets = () => {
      // Remove existing asset layers and sources
      ['assets-primary', 'assets-secondary'].forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
      });
      if (mapInstance.getSource('assets-source')) {
        mapInstance.removeSource('assets-source');
      }

      if (assets && assets.length > 0) {
        console.log(`Processing ${assets.length} assets for display`);
        
        // Create GeoJSON data
        const features = assets.map(asset => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: asset.coordinates
          },
          properties: {
            ...asset,
            // Ensure isPrimary is properly set
            isPrimary: asset.isPrimary || false
          }
        }));

        const geojsonData = {
          type: 'FeatureCollection' as const,
          features
        };

        console.log("GeoJSON features created:", features.length);
        console.log("Primary assets:", features.filter(f => f.properties.isPrimary).length);
        console.log("Secondary assets:", features.filter(f => !f.properties.isPrimary).length);

        // Add source
        mapInstance.addSource('assets-source', {
          type: 'geojson',
          data: geojsonData
        });

        // Add primary assets layer (green)
        mapInstance.addLayer({
          id: 'assets-primary',
          type: 'circle',
          source: 'assets-source',
          filter: ['==', ['get', 'isPrimary'], true],
          paint: {
            'circle-color': '#22c55e', // Bright green
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.8
          }
        });

        // Add secondary assets layer (red)
        mapInstance.addLayer({
          id: 'assets-secondary',
          type: 'circle',
          source: 'assets-source',
          filter: ['==', ['get', 'isPrimary'], false],
          paint: {
            'circle-color': '#ef4444', // Dull red
            'circle-radius': 6,
            'circle-opacity': 0.7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.5
          }
        });

        // Add click handlers for popups
        ['assets-primary', 'assets-secondary'].forEach(layerId => {
          mapInstance.on('click', layerId, (e) => {
            if (!e.features || e.features.length === 0) return;
            
            const properties = e.features[0].properties;
            const coordinates = (e.features[0].geometry as any).coordinates.slice();

            // Create popup content
            const popupHTML = `
              <div style="color: white; font-family: sans-serif;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${properties.name || 'Unknown Asset'}</h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #ccc;">${properties.type || 'Unknown Type'}</p>
                ${properties.capacity ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #ccc;">Capacity: ${properties.capacity}</p>` : ''}
                ${properties.status ? `<p style="margin: 0; font-size: 12px; color: #ccc;">Status: ${properties.status}</p>` : ''}
              </div>
            `;

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(popupHTML)
              .addTo(mapInstance);
          });

          // Change cursor on hover
          mapInstance.on('mouseenter', layerId, () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', layerId, () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        });

        console.log("Asset layers added successfully");
      } else {
        console.log("No assets to display");
      }
    };

    if (mapInstance.isStyleLoaded()) {
      addAssets();
    } else {
      mapInstance.on('style.load', addAssets);
    }
  }, [assets]);

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
        map.current?.flyTo({ center: coordinates, zoom: 12 });
      },
      (error) => console.error('Error getting location:', error)
    );
  };

  return (
    <div className="relative w-full h-full bg-gray-800">
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ minHeight: '400px' }} // Ensure minimum height
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <Crosshair className="w-8 h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 255, 255, 0.7))' }}/>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10">
        <Button onClick={getCurrentLocation} size="icon" className="bg-card/80 hover:bg-card border-border shadow-lg backdrop-blur-sm" variant="outline">
          <Crosshair className="w-4 h-4" />
        </Button>
      </div>
      
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="p-3 bg-card/80 backdrop-blur-sm border-border shadow-lg">
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full"></div>
                <span className="text-xs font-medium text-gray-200">Primary Assets (Within {selectedLocation.radius}km)</span>
            </div>
             <div className="flex items-center space-x-2 mt-2">
                <div className="w-3 h-3 bg-[#ef4444] border border-white/50 rounded-full opacity-70"></div>
                <span className="text-xs font-medium text-gray-300">Secondary Assets (Up to 100km)</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};