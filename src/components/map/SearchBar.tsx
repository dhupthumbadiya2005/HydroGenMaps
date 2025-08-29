import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { searchLocations, LocationData } from '@/services/mapbox';
import { useToast } from '@/hooks/use-toast';

interface SearchBarProps {
  onLocationSelect: (location: LocationData, radius: number) => void;
  loading?: boolean;
}

const radiusOptions = [
  { value: '2', label: '2 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '15', label: '15 km' },
  { value: '30', label: '30 km' },
  { value: '50', label: '50 km' }
];

export const SearchBar: React.FC<SearchBarProps> = ({ onLocationSelect, loading = false }) => {
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState('10');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setShowSuggestions(false);
    
    try {
      const results = await searchLocations(query);
      if (results.length > 0) {
        const selectedLocation = results[0];
        onLocationSelect(selectedLocation, parseInt(radius));
        setQuery('');
        
        toast({
          title: "Location found!",
          description: `Analyzing ${selectedLocation.name}`,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.length > 2) {
      setSuggestionsLoading(true);
      try {
        const results = await searchLocations(value);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Suggestion search failed:', error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (location: LocationData) => {
    setQuery(location.name);
    setShowSuggestions(false);
    onLocationSelect(location, parseInt(radius));
    
    toast({
      title: "Location selected!",
      description: `Analyzing ${location.name}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for a location (e.g., Delhi, New York, London)..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>
          
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-24 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {radiusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleSearch} 
            disabled={!query.trim() || searching || loading}
            className="h-12 px-6 btn-gradient"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
            <CardContent className="p-0">
              {suggestionsLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
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
                ))
              ) : (
                <div className="p-4 text-center">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">No locations found</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};