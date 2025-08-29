import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Zap, CheckCircle } from 'lucide-react';
import { AnalysisResult } from '@/services/mapbox';

interface RecommendationPopupProps {
  analysis: AnalysisResult;
  onClose: () => void;
  onGetRecommendations?: () => void;
}

export const RecommendationPopup: React.FC<RecommendationPopupProps> = ({
  analysis,
  onClose,
  onGetRecommendations
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-xl animate-scale-in">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2"
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center space-x-2 pr-8">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Location Analysis</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Location Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{analysis.location.name}</h3>
            <p className="text-muted-foreground text-sm">{analysis.location.address}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span>
                <strong>Coordinates:</strong> {analysis.location.coordinates[1].toFixed(4)}, {analysis.location.coordinates[0].toFixed(4)}
              </span>
              <span>
                <strong>Radius:</strong> {analysis.radius} km
              </span>
            </div>
          </div>

          {/* Analysis Score */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">Hydrogen Potential Score</span>
            </div>
            <Badge variant={getScoreBadgeVariant(analysis.score)} className="text-lg font-bold px-3 py-1">
              {analysis.score}/100
            </Badge>
          </div>

          {/* Recommendations Preview */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Key Insights</span>
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={onGetRecommendations} 
              className="flex-1 btn-gradient"
            >
              Get Full Report
            </Button>
          </div>

          {/* Phase 2 Notice */}
          <div className="bg-accent-light/20 border border-accent/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              🚀 <strong>Phase 2:</strong> Advanced AI-powered recommendations and detailed scoring algorithms will be integrated here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};