import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { SearchBar } from '@/components/map/SearchBar';
import { RecommendationPopup } from '@/components/map/RecommendationPopup';
import { Card } from '@/components/ui/card';
import { LocationData, AnalysisResult, analyzeLocation } from '@/services/mapbox';
import { useToast } from '@/hooks/use-toast';

export const Explore: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: [number, number];
    radius: number;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLocationSelect = async (location: LocationData, radius: number) => {
    setLoading(true);
    try {
      // Update map
      setSelectedLocation({
        coordinates: location.coordinates,
        radius
      });

      // Perform analysis
      const result = await analyzeLocation(location, radius);
      setAnalysisResult(result);

      toast({
        title: "Analysis complete!",
        description: `Found hydrogen potential score of ${result.score}/100 for ${location.name}`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (coordinates: [number, number]) => {
    // For map clicks, use default 10km radius and create location data
    const location: LocationData = {
      name: 'Selected Location',
      coordinates,
      address: `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`
    };
    
    handleLocationSelect(location, 10);
  };

  const handleGetRecommendations = () => {
    toast({
      title: "Feature coming soon!",
      description: "Detailed recommendations will be available in Phase 2.",
    });
    setAnalysisResult(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-6 border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Explore Hydrogen Sites</h1>
            <p className="text-muted-foreground">
              Search locations and analyze their hydrogen production potential
            </p>
          </div>
          <SearchBar 
            onLocationSelect={handleLocationSelect}
            loading={loading}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 p-6">
        <Card className="h-full overflow-hidden shadow-lg">
          <MapContainer
            onLocationSelect={handleMapClick}
            selectedLocation={selectedLocation}
          />
        </Card>
      </div>

      {/* Analysis Results Popup */}
      {analysisResult && (
        <RecommendationPopup
          analysis={analysisResult}
          onClose={() => setAnalysisResult(null)}
          onGetRecommendations={handleGetRecommendations}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <Card className="p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="font-medium">Analyzing location...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};