import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import { 
  AnalysisResponse, 
  ParsedAnalysisData, 
  ChartData 
} from './types';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';

interface AnalysisReportVisualizationProps {
  data: AnalysisResponse;
  className?: string;
}

export const AnalysisReportVisualization: React.FC<AnalysisReportVisualizationProps> = ({ 
  data, 
  className = '' 
}) => {
  // Parse and transform the data
  const parsedData: ParsedAnalysisData = React.useMemo(() => {
    const parseScore = (score: string): number => {
      const num = parseFloat(score);
      return isNaN(num) ? 0 : Math.round(num * 100);
    };

    const parseAISummary = (summary: string) => {
      // Split the summary into lines and clean them
      const lines = summary.split('\n').filter(line => line.trim());
      
      const insights: string[] = [];
      const recommendations: string[] = [];
      const summaryPoints: string[] = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) return;
        
        // Check for bullet points or numbered items
        if (trimmed.match(/^[•\-*]\s/) || trimmed.match(/^\d+\.\s/)) {
          const content = trimmed.replace(/^[•\-*]\s/, '').replace(/^\d+\.\s/, '');
          if (content.toLowerCase().includes('recommend') || content.toLowerCase().includes('suggest')) {
            recommendations.push(content);
          } else {
            insights.push(content);
          }
        } 
        // Check for longer sentences that might be insights
        else if (trimmed.length > 20 && !trimmed.toLowerCase().includes('based on') && !trimmed.toLowerCase().includes('summary')) {
          summaryPoints.push(trimmed);
        }
      });

      // If no structured content found, create readable format from the full text
      if (insights.length === 0 && recommendations.length === 0) {
        // Split by sentence endings and ensure complete sentences
        const sentenceRegex = /[^.!?]+[.!?]+/g;
        const sentences: string[] = [];
        let match;
        
        while ((match = sentenceRegex.exec(summary)) !== null) {
          const sentence = match[0].trim();
          if (sentence.length > 15 && sentence.length < 200) {
            sentences.push(sentence);
          }
        }
        
        // If regex didn't work well, try manual splitting
        if (sentences.length === 0) {
          const manualSplit = summary.split(/[.!?]/).filter(s => s.trim().length > 15 && s.trim().length < 200);
          sentences.push(...manualSplit);
        }
        
        // Distribute sentences between insights and recommendations
        const midPoint = Math.ceil(sentences.length / 2);
        insights.push(...sentences.slice(0, midPoint));
        if (sentences.length > midPoint) {
          recommendations.push(...sentences.slice(midPoint));
        }
      }

      return {
        insights: insights.length > 0 ? insights : ['Analysis completed successfully'],
        recommendations: recommendations.length > 0 ? recommendations : ['Consider the overall scores for decision making'],
        summary: summary,
        summaryPoints: summaryPoints.length > 0 ? summaryPoints : [summary]
      };
    };

    return {
      infrastructure: parseScore(data.s_infra),
      environmental: parseScore(data.s_env),
      economic: parseScore(data.s_econ),
      average: parseScore(data.s_avg),
      xgboostAggregate: parseScore(data.s_xgboost_aggregate),
      userCustomPref: parseScore(data.s_user_custom_pref),
      aiSummary: parseAISummary(data.ai_summary)
    };
  }, [data]);

  // Prepare chart data
  const barChartData: ChartData[] = React.useMemo(() => [
    { 
      name: 'Infrastructure', 
      value: parsedData.infrastructure, 
      color: getScoreColor(parsedData.infrastructure) 
    },
    { 
      name: 'Environmental', 
      value: parsedData.environmental, 
      color: getScoreColor(parsedData.environmental) 
    },
    { 
      name: 'Economic', 
      value: parsedData.economic, 
      color: getScoreColor(parsedData.economic) 
    }
  ], [parsedData]);

  const radarChartData = React.useMemo(() => [
    { subject: 'Infrastructure', A: parsedData.infrastructure, fullMark: 100 },
    { subject: 'Environmental', A: parsedData.environmental, fullMark: 100 },
    { subject: 'Economic', A: parsedData.economic, fullMark: 100 },
    { subject: 'XGBoost Score', A: parsedData.xgboostAggregate, fullMark: 100 },
    { subject: 'User Preference', A: parsedData.userCustomPref, fullMark: 100 }
  ], [parsedData]);

  // Helper function to get color based on score
  function getScoreColor(score: number): string {
    if (score < 30) return '#ef4444'; // red
    if (score < 50) return '#f59e0b'; // yellow
    return '#10b981'; // green
  }

  // Helper function to get score status
  function getScoreStatus(score: number): { icon: React.ReactNode; text: string; variant: 'default' | 'secondary' | 'destructive' } {
    if (score < 30) return { icon: <AlertTriangle className="w-4 h-4" />, text: 'Low', variant: 'destructive' as const };
    if (score < 50) return { icon: <Target className="w-4 h-4" />, text: 'Medium', variant: 'secondary' as const };
    return { icon: <CheckCircle className="w-4 h-4" />, text: 'High', variant: 'default' as const };
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Score */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-500">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-2xl text-white">
            <BarChart3 className="w-8 h-8 text-white" />
            <span>Hydrogen Site Analysis Report</span>
          </CardTitle>
          <div className="mt-4">
            <div className="text-4xl font-bold text-white mb-2">
              {parsedData.xgboostAggregate}%
            </div>
            <p className="text-blue-100 font-medium">Overall Score</p>
          </div>
        </CardHeader>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Infrastructure Score', value: parsedData.infrastructure, icon: TrendingUp },
          { label: 'Environmental Score', value: parsedData.environmental, icon: CheckCircle },
          { label: 'Economic Score', value: parsedData.economic, icon: Target },
          { label: 'Our Reccomendations', value: parsedData.xgboostAggregate, icon: BarChart3 },
          { label: 'User Preference Influenced Score', value: parsedData.userCustomPref, icon: Lightbulb },
          { label: 'Average Score', value: parsedData.average, icon: TrendingUp }
        ].map((metric, index) => {
          const status = getScoreStatus(metric.value);
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <metric.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </span>
                  </div>
                  <Badge variant={status.variant} className="flex items-center space-x-1">
                    {status.icon}
                    <span>{status.text}</span>
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-2">{metric.value}%</div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full transition-all"
                    style={{ 
                      width: `${metric.value}%`,
                      backgroundColor: getScoreColor(metric.value)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Factor Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Score']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comprehensive Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <span>AI Analysis Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Insights */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Key Insights
            </h4>
            <ul className="space-y-3">
              {parsedData.aiSummary.insights.map((insight, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed text-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Recommendations
            </h4>
            <ol className="space-y-3">
              {parsedData.aiSummary.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{rec}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Summary Points */}
          {parsedData.aiSummary.summaryPoints.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                Summary Points
              </h4>
              <ul className="space-y-3">
                {parsedData.aiSummary.summaryPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Summary with Scrolling */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Complete Analysis
            </h4>
            <div className="max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-4 border">
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {parsedData.aiSummary.summary}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
