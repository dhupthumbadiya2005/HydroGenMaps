import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { SearchBar } from '@/components/map/SearchBar';
import { Card } from '@/components/ui/card';
import { LocationData, AnalysisResult, analyzeLocation } from '@/services/mapbox';
import { useToast } from '@/hooks/use-toast';

export const Explore: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: [number, number];
    radius: number;
  } | null>(null);
  const [currentRadius, setCurrentRadius] = useState<number>(10); // Track current radius with default 10km
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<[number, number] | null>(null);
  const [selectedRadiusOption, setSelectedRadiusOption] = useState<number>(10);
  const { toast } = useToast();

  const handleLocationSelect = async (location: LocationData, radius: number) => {
    setLoading(true);
    setShowPopup(false);
    setAnalysisResult(null);

    try {
      // Update current radius when user selects from search bar
      setCurrentRadius(radius);
      
      // First, update map to show the selected location
      setSelectedLocation({
        coordinates: location.coordinates,
        radius
      });

      // Wait for map to update and show location
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show toast notification about analysis starting
      toast({
        title: "Analyzing location...",
        description: `Analyzing hydrogen potential for ${location.name}`,
      });

      // Perform analysis
      const result = await analyzeLocation(location, radius);
      setAnalysisResult(result);

      // Wait 2-3 seconds to show the popup after analysis
      setTimeout(() => {
        setShowPopup(true);
        toast({
          title: "Analysis complete!",
        });
      }, 1000);

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
    // Store the clicked coordinates and show radius selector
    setPendingLocation(coordinates);
    setSelectedRadiusOption(currentRadius); // Default to current radius
    setShowRadiusSelector(true);
  };

  const handleRadiusConfirm = () => {
    if (!pendingLocation) return;
    
    // Update current radius for future use
    setCurrentRadius(selectedRadiusOption);
    
    // Create location data and proceed with analysis
    const location: LocationData = {
      name: 'Selected Location',
      coordinates: pendingLocation,
      address: `${pendingLocation[1].toFixed(4)}, ${pendingLocation[0].toFixed(4)}`
    };
    
    // Close radius selector and proceed
    setShowRadiusSelector(false);
    setPendingLocation(null);
    handleLocationSelect(location, selectedRadiusOption);
  };

  const handleRadiusCancel = () => {
    setShowRadiusSelector(false);
    setPendingLocation(null);
  };

  const handleGetRecommendations = () => {
    toast({
      title: "Feature coming soon!",
      description: "Detailed recommendations will be available in Phase 2.",
    });
    setAnalysisResult(null);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
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
        <Card className="h-full overflow-hidden shadow-lg relative">
          <MapContainer
            onLocationSelect={handleMapClick}
            selectedLocation={selectedLocation}
          />
          
          {/* Location Selected Indicator */}
          {selectedLocation && !loading && !showPopup && (
            <div className="absolute top-4 left-4 z-30">
              <Card className="p-3 bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Location selected</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Radius: {selectedLocation.radius} km
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>

      

      {/* Radius Selector Modal */}
      {showRadiusSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Select Analysis Radius</h3>
              <p className="text-sm text-muted-foreground">
                Choose the radius for analyzing this location
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[5, 10, 20, 30, 50, 100].map((radius) => (
                <label
                  key={radius}
                  className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                  style={{
                    backgroundColor: selectedRadiusOption === radius ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    borderColor: selectedRadiusOption === radius ? 'hsl(var(--primary))' : 'hsl(var(--border))'
                  }}
                >
                  <input
                    type="radio"
                    name="radius"
                    value={radius}
                    checked={selectedRadiusOption === radius}
                    onChange={(e) => setSelectedRadiusOption(Number(e.target.value))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="flex-1 font-medium">{radius} km radius</span>
                  <span className="text-xs text-muted-foreground">
                    {radius <= 10 ? 'Small area' : radius <= 30 ? 'Medium area' : 'Large area'}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRadiusCancel}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRadiusConfirm}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Analyze Location
              </button>
            </div>
          </Card>
        </div>
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

      {/* Analysis Complete Indicator */}
      {analysisResult && !showPopup && !loading && (
        <div className="fixed bottom-4 right-4 z-30">
          <Card className="p-4 bg-success/10 border-success/20 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success-foreground">
                Analysis complete!
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};