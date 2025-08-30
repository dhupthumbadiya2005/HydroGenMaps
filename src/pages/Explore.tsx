import React, { useState, useEffect } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { SearchBar } from '@/components/map/SearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { LocationData, AnalysisResult, analyzeLocation } from '@/services/mapbox';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS, getApiUrl } from '@/services/endpoints';
import { Lightbulb, X, Loader2 } from 'lucide-react';

interface RecommendationForm {
  infrastructureProximity: number;
  environmentLandFactors: number;
  economicPolicyDrivers: number;
  description: string;
}

export const Explore: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    coordinates: [number, number];
    radius: number;
  } | null>(null);
  const [currentRadius, setCurrentRadius] = useState<number>(10);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<[number, number] | null>(null);
  const [selectedRadiusOption, setSelectedRadiusOption] = useState<number>(10);
  
  // Recommendation popup states
  const [showRecommendationSlider, setShowRecommendationSlider] = useState(false);
  const [recommendationForm, setRecommendationForm] = useState<RecommendationForm>({
    infrastructureProximity: 50,
    environmentLandFactors: 50,
    economicPolicyDrivers: 50,
    description: ''
  });
  const [analyzingRecommendation, setAnalyzingRecommendation] = useState(false);
  
  const { toast } = useToast();

  // Track location and range changes - send to endpoint
  useEffect(() => {
    if (selectedLocation) {
      sendLocationTracking(selectedLocation.coordinates, selectedLocation.radius);
    }
  }, [selectedLocation]);

  // Send location tracking data to endpoint
  const sendLocationTracking = async (coordinates: [number, number], radius: number) => {
    try {
      const trackingData = {
        coordinates: {
          latitude: coordinates[1],
          longitude: coordinates[0]
        },
        radius: radius,
        
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.LOCATION.TRACKING), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (!response.ok) {
        console.error('Location tracking failed:', response.status);
      }
    } catch (error) {
      console.error('Error sending location tracking:', error);
    }
  };

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

      // Wait 2 seconds then show recommendation slider
      setTimeout(() => {
        setShowRecommendationSlider(true);
        toast({
          title: "Analysis complete!",
          description: "Get detailed recommendations for this location.",
        });
      }, 2000);

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
    setSelectedRadiusOption(currentRadius);
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
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location first to get recommendations.",
        variant: "destructive",
      });
      return;
    }
    
    setShowRecommendationSlider(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setAnalysisResult(null);
  };

  const handleCloseRecommendationSlider = () => {
    setShowRecommendationSlider(false);
  };

  // Convert slider value (0-100) to API value (0-1)
  const sliderToApiValue = (value: number): number => {
    return value / 100;
  };

  // Convert API value (0-1) to slider value (0-100)
  const apiToSliderValue = (value: number): number => {
    return value * 100;
  };

  const handleAnalyzeRecommendation = async () => {
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location first.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzingRecommendation(true);

    try {
      const analysisData = {
        location: {
          coordinates: {
            latitude: selectedLocation.coordinates[1],
            longitude: selectedLocation.coordinates[0]
          },
          radius: selectedLocation.radius
        },
        factors: {
          infrastructureProximity: sliderToApiValue(recommendationForm.infrastructureProximity),
          environmentLandFactors: sliderToApiValue(recommendationForm.environmentLandFactors),
          economicPolicyDrivers: sliderToApiValue(recommendationForm.economicPolicyDrivers)
        },
        description: recommendationForm.description,
        
      };

      const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYSIS.RECOMMENDATION_ANALYSIS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Recommendation analysis complete!",
        description: "Your detailed analysis has been processed.",
      });

      // Close the slider popup
      setShowRecommendationSlider(false);
      
      // Reset form
      setRecommendationForm({
        infrastructureProximity: 50,
        environmentLandFactors: 50,
        economicPolicyDrivers: 50,
        description: ''
      });

    } catch (error) {
      console.error('Recommendation analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingRecommendation(false);
    }
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
      <div className="flex-1 p-6 relative">
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

          {/* Map blur overlay when recommendation slider is open */}
          {showRecommendationSlider && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none" />
          )}
        </Card>

        {/* Sticky "Get Recommendation" Button - Right Side */}
        {selectedLocation && !showRecommendationSlider && (
          <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              onClick={handleGetRecommendations}
              className="btn-gradient shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 px-4 py-3 rounded-full"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Get Recommendation</span>
            </Button>
          </div>
        )}
      </div>

      {/* Recommendation Slider Popup - Sticky Right Side */}
      {showRecommendationSlider && (
        <div className="fixed top-0 right-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Get Recommendations</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseRecommendationSlider}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {/* Infrastructure and Proximity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Infrastructure and Proximity: {recommendationForm.infrastructureProximity}
                </Label>
                <Slider
                  value={[recommendationForm.infrastructureProximity]}
                  onValueChange={(value) => setRecommendationForm(prev => ({
                    ...prev,
                    infrastructureProximity: value[0]
                  }))}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Evaluate proximity to existing infrastructure, transportation networks, and utilities
                </p>
              </div>

              {/* Environment and Land Factors */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Environment and Land Factors: {recommendationForm.environmentLandFactors}
                </Label>
                <Slider
                  value={[recommendationForm.environmentLandFactors]}
                  onValueChange={(value) => setRecommendationForm(prev => ({
                    ...prev,
                    environmentLandFactors: value[0]
                  }))}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Assess environmental impact, land suitability, and regulatory considerations
                </p>
              </div>

              {/* Economic and Policy Drivers */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Economic and Policy Drivers: {recommendationForm.economicPolicyDrivers}
                </Label>
                <Slider
                  value={[recommendationForm.economicPolicyDrivers]}
                  onValueChange={(value) => setRecommendationForm(prev => ({
                    ...prev,
                    economicPolicyDrivers: value[0]
                  }))}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Consider economic incentives, policy support, and market conditions
                </p>
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description of Current Assets and Investment Plans
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your current hydrogen infrastructure assets, investment plans, and strategic objectives..."
                value={recommendationForm.description}
                onChange={(e) => setRecommendationForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyzeRecommendation}
              disabled={analyzingRecommendation}
              className="w-full btn-gradient"
            >
              {analyzingRecommendation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Recommendations'
              )}
            </Button>
          </div>
        </div>
      )}

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