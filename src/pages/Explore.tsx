import React, { useState, useCallback, useEffect } from 'react';
// Components
// MODIFIED: Switched to relative paths to resolve alias errors
import { MapContainer } from '../components/map/MapContainer';
import { RecommendationPopup } from '../components/map/RecommendationPopup';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Zap, MapPin, Activity } from 'lucide-react';
// Services & Types
import { LocationData, AnalysisResult, analyzeLocation, getAssetsInDualRadius, NearbyAsset, searchLocations } from '../services/mapbox';
// Hooks
import { useToast } from '../hooks/use-toast';
import { useDebounce } from '../hooks/useDebounce';

export const Explore: React.FC = () => {
    const [mapCenter, setMapCenter] = useState<[number, number]>([72.5714, 23.0225]); // Start at Ahmedabad
    const [mapZoom, setMapZoom] = useState<number>(10); // Closer zoom to see details
    const [radius, setRadius] = useState<number>(50); // Start with 50km radius
    const [selectedLocation, setSelectedLocation] = useState<{ coordinates: [number, number]; radius: number; } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [nearbyAssets, setNearbyAssets] = useState<NearbyAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LocationData[]>([]);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Floating particles effect
    useEffect(() => {
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 25000);
        };

        const particleInterval = setInterval(createParticle, 2000);
        
        // Create initial particles
        for (let i = 0; i < 5; i++) {
            setTimeout(createParticle, i * 500);
        }

        return () => clearInterval(particleInterval);
    }, []);

    React.useEffect(() => {
        if (debouncedSearchQuery) {
            searchLocations(debouncedSearchQuery).then(setSearchResults);
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery]);

    const handleLocationSearchSelect = (location: LocationData) => {
        console.log("Selected location:", location);
        setMapCenter(location.coordinates);
        setMapZoom(12);
        setSearchQuery('');
        setSearchResults([]);
        
        // Auto-analyze when location is selected
        setTimeout(() => {
            handleAnalyzeLocation(location.coordinates);
        }, 1000);
    };

    const handleMapMove = useCallback((center: [number, number], zoom: number) => {
        setMapCenter(center);
        setMapZoom(zoom);
    }, []);

    const handleAnalyzeLocation = async (coordinates?: [number, number]) => {
        setLoading(true);
        setShowPopup(false);
        setAnalysisResult(null);
        
        const coordsToUse = coordinates || mapCenter;
        console.log("Analyzing location:", coordsToUse, "with radius:", radius);
        
        const locationToAnalyze: LocationData = { 
            name: 'Analyzed Location', 
            coordinates: coordsToUse, 
            address: `${coordsToUse[1].toFixed(4)}, ${coordsToUse[0].toFixed(4)}` 
        };

        try {
            // Set the selected location first
            setSelectedLocation({ coordinates: coordsToUse, radius: radius });
            
            // Get assets in dual radius
            console.log("Getting assets in dual radius...");
            const assets = getAssetsInDualRadius(coordsToUse, radius, 100);
            console.log("Assets returned from getAssetsInDualRadius:", assets);
            
            // Set the assets state
            setNearbyAssets(assets);
            
            toast({ 
                title: "Analyzing location...", 
                description: `Found ${assets.length} assets. ${assets.filter(a => a.isPrimary).length} within ${radius}km radius.`
            });
            
            const result = await analyzeLocation(locationToAnalyze, radius);
            setAnalysisResult(result);
            
            setTimeout(() => {
                setShowPopup(true);
                toast({ 
                    title: "Analysis complete!", 
                    description: `Potential score of ${result.score}/100 found. ${assets.length} assets analyzed.`
                });
            }, 1500);
        } catch (error) {
            console.error('Analysis failed:', error);
            toast({ title: "Analysis failed", description: "Please try again later.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const handleClosePopup = () => {
        setShowPopup(false);
        setAnalysisResult(null);
    };

    const handleGetRecommendations = () => {
        toast({ title: "Feature coming soon!" });
    };

    // Load assets immediately on component mount for current location
    React.useEffect(() => {
        console.log("Component mounted, loading initial assets...");
        handleAnalyzeLocation();
    }, []); // Run once on mount

    const radiusOptions = [10, 15, 20, 30, 50, 80, 100];

    return (
        <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">
            {/* Header Section with Enhanced Styling */}
            <div className="explore-header p-6 border-b border-border relative z-10">
                <div className="relative">
                    <h1 className="explore-title text-3xl font-bold mb-2">
                        Explore Hydrogen Sites
                    </h1>
                    <p className="text-muted-foreground text-lg mb-6 opacity-90">
                        Search locations and analyze their hydrogen production potential
                    </p>
                </div>
                
                <div className="flex items-center gap-4 relative z-20">
                    <div className="search-container relative flex-grow">
                        <div className="relative">
                            <Search className="search-icon absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
                            <Input
                                type="text"
                                placeholder="Search for a location (e.g., Delhi, New York, London)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input pl-12 pr-4 py-4 text-base font-medium focus-visible gpu-accelerated"
                            />
                        </div>
                        
                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map((loc, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleLocationSearchSelect(loc)} 
                                        className="search-result-item block w-full text-left relative z-10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-primary-hydrogen opacity-70" />
                                            <div>
                                                <p className="font-semibold text-white">{loc.name}</p>
                                                <p className="text-xs text-muted-foreground">{loc.address}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="relative">
                        <Select 
                            value={String(radius)} 
                            onValueChange={(value) => {
                                const newRadius = Number(value);
                                setRadius(newRadius);
                                console.log("Radius changed to:", newRadius);
                                // Re-analyze with new radius
                                if (selectedLocation) {
                                    setTimeout(() => handleAnalyzeLocation(), 500);
                                }
                            }}
                        >
                            <SelectTrigger className="select-enhanced w-[140px] py-4 font-medium hover-lift">
                                <SelectValue placeholder="Radius" />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-0">
                                {radiusOptions.map(option => (
                                    <SelectItem 
                                        key={option} 
                                        value={String(option)}
                                        className="hover:bg-primary-hydrogen/10 transition-colors duration-200"
                                    >
                                        <span className="text-tech">{option} km</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        onClick={() => handleAnalyzeLocation()} 
                        disabled={loading}
                        className="analyze-button relative overflow-hidden px-6 py-4 font-bold text-base hover-lift gpu-accelerated focus-visible"
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            <Zap className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                            <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
                        </div>
                    </Button>
                </div>

                {/* Enhanced Debug Info */}
                {nearbyAssets.length > 0 && (
                    <div className="debug-info mt-6 relative">
                        <div className="flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-primary-hydrogen" />
                            <span className="text-tech font-medium">
                                Debug: Found <span className="text-gradient font-bold">{nearbyAssets.length}</span> total assets | 
                                <span className="text-green-400 font-bold"> {nearbyAssets.filter(a => a.isPrimary).length}</span> within {radius}km | 
                                <span className="text-red-400 font-bold"> {nearbyAssets.filter(a => !a.isPrimary).length}</span> outside radius
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Map Area */}
            <div className="flex-1 p-6 pt-4 relative z-10">
                <Card className="map-container w-full h-full glass-card hover-lift gpu-accelerated relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-hydrogen/5 via-transparent to-primary-energy/5 pointer-events-none"></div>
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        onMapMove={handleMapMove}
                        selectedLocation={selectedLocation}
                        assets={nearbyAssets}
                    />
                    
                    {/* Map Overlay Effects */}
                    <div className="absolute top-4 right-4 z-20">
                        <div className="glass-card px-3 py-2 text-xs text-tech">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Primary Assets (Within {radius}km)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                                <span>Secondary Assets (Up to 100km)</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Enhanced Popups and Overlays */}
            {analysisResult && showPopup && (
                <div className="recommendation-popup">
                    <div className="popup-content">
                        <RecommendationPopup
                            analysis={analysisResult}
                            onClose={handleClosePopup}
                            onGetRecommendations={handleGetRecommendations}
                        />
                    </div>
                </div>
            )}
            
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-card">
                        <div className="spinner"></div>
                        <div className="text-center">
                            <h3 className="text-gradient text-lg font-bold mb-2">Analyzing Location</h3>
                            <p className="text-muted-foreground text-tech">
                                Processing hydrogen production potential...
                            </p>
                            <div className="mt-4 flex justify-center">
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div 
                                            key={i}
                                            className="w-2 h-2 bg-primary-hydrogen rounded-full animate-pulse"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 left-10 w-96 h-96 bg-primary-hydrogen/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-energy/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-electric/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
        </div>
    );
};