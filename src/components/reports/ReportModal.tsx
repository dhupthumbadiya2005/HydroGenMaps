import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnalysisReportVisualization } from './AnalysisReportVisualization';
import { AnalysisResponse, SaveReportRequest } from './types';
import { API_ENDPOINTS } from '@/services/endpoints';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Loader2, Download } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResponse | null;
  location: {
    coordinates: [number, number];
    radius: number;
    name?: string;
    address?: string;
  } | null;
  userEmail: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  data,
  location,
  userEmail
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveReport = async () => {
    if (!data || !location) {
      toast({
        title: "Error",
        description: "No data available to save.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const saveRequest: SaveReportRequest = {
        message: JSON.stringify(data),
        email: userEmail
      };

      const response = await fetch(API_ENDPOINTS.ANALYSIS.SAVE_REPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Report saved successfully:', result);

      toast({
        title: "Report Saved!",
        description: "Your analysis report has been saved successfully.",
      });

      // Close modal after successful save
      onClose();

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (!data) return;

    // Create a formatted report text
    const reportText = `
Hydrogen Site Analysis Report
Generated: ${new Date().toLocaleString()}
Location: ${location?.name || `${location?.coordinates[1]}, ${location?.coordinates[0]}`}
Radius: ${location?.radius} km

SCORES:
- Infrastructure: ${(parseFloat(data.s_infra) * 100).toFixed(1)}%
- Environmental: ${(parseFloat(data.s_env) * 100).toFixed(1)}%
- Economic: ${(parseFloat(data.s_econ) * 100).toFixed(1)}%
- Average: ${(parseFloat(data.s_avg) * 100).toFixed(1)}%
- XGBoost Aggregate: ${(parseFloat(data.s_xgboost_aggregate) * 100).toFixed(1)}%
- User Preference: ${(parseFloat(data.s_user_custom_pref) * 100).toFixed(1)}%

AI SUMMARY:
${data.ai_summary}
    `.trim();

    // Create and download file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrogen-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Analysis report has been downloaded as a text file.",
    });
  };

  if (!data) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Hydrogen Site Analysis Report
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <AnalysisReportVisualization data={data} />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleSaveReport}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Report</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
