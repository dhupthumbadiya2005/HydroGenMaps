import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Eye, Trash2, Search } from 'lucide-react';
import { API_ENDPOINTS } from '@/services/endpoints';
import { auth } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { AnalysisReportVisualization } from '@/components/reports/AnalysisReportVisualization';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface SavedReport {
  id: string;
  email: string;
  message: string; // This contains the JSON string of the analysis data
  name: string; // Report name
  timestamp?: string;
}

interface AnalysisData {
  s_infra: string;
  s_env: string;
  s_econ: string;
  s_avg: string;
  s_xgboost_aggregate: string;
  s_user_custom_pref: string;
  ai_summary: string;
}

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState<{ data: AnalysisData; isOpen: boolean }>({
    data: {} as AnalysisData,
    isOpen: false
  });

  // Firebase Auth state
  const [user, loading_auth] = useAuthState(auth);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.ANALYSIS.VIEW_REPORT);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched reports:', data);

        // Filter reports by current user's email
        const userReports = data.filter((report: SavedReport) => 
          report.email === user.email
        );

        setReports(userReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchReports();
    }
  }, [user?.email]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });



  const handleView = (report: SavedReport) => {
    try {
      // Parse the JSON message to get analysis data
      const analysisData: AnalysisData = JSON.parse(report.message);
      setViewingReport({
        data: analysisData,
        isOpen: true
      });
    } catch (error) {
      console.error('Error parsing report data:', error);
      alert('Error loading report data');
    }
  };



  const handleDelete = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      // Placeholder for delete functionality
      console.log('Deleting report:', reportId);
      // You can implement actual delete API call here
    }
  };

  // Show loading state while Firebase Auth is initializing
  if (loading_auth) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="font-medium">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Show authentication required state if user is not logged in
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 max-w-md mx-4 shadow-xl text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please log in to view your saved reports.
            </p>
            <Button 
              onClick={() => {
                window.location.href = '/login';
              }}
              className="btn-gradient"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View and manage your hydrogen site analysis reports
        </p>
        <div className="mt-2 text-sm text-muted-foreground">
          Logged in as: {user.email}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by report name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search criteria.'
                  : 'Start analyzing locations to generate your first report.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{report.name || 'Analysis Report'}</h3>
                      <Badge className="bg-success text-success-foreground">
                        Completed
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          Report ID: {report.id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          Saved by: {report.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleView(report)}
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(report.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Report Modal */}
      <Dialog open={viewingReport.isOpen} onOpenChange={(open) => setViewingReport(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Hydrogen Site Analysis Report
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingReport(prev => ({ ...prev, isOpen: false }))}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <div className="mt-4">
            <AnalysisReportVisualization data={viewingReport.data} />
          </div>

          <div className="flex justify-end pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setViewingReport(prev => ({ ...prev, isOpen: false }))}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};