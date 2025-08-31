import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Eye, Trash2, Search, BarChart3, Send, Bot } from 'lucide-react';
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

  // Comparison states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'bot'; message: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  // Comparison functions
  const handleCompareReports = () => {
    setShowCompareModal(true);
    setSelectedReports([]);
  };

  const handleReportSelection = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleStartComparison = () => {
    if (selectedReports.length < 2) {
      alert('Please select at least 2 reports to compare');
      return;
    }
    setShowCompareModal(false);
    setShowChatbot(true);
    // Initialize chat with welcome message
    setChatMessages([{
      type: 'bot',
      message: `Hello! I can help you compare ${selectedReports.length} reports. You can ask me questions about:

• Infrastructure scores and trends
• Environmental factors  
• Economic viability
• Overall performance comparison
• Specific insights from any report

What would you like to know?`
    }]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user?.email) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatLoading(true);

    try {
      // Prepare the selected reports data with full JSON
      const selectedReportsData = selectedReports.map(reportId => {
        const report = reports.find(r => r.id === reportId);
        if (!report) return null;
        
        try {
          const analysisData = JSON.parse(report.message);
          return {
            name: report.name,
            summary: analysisData.ai_summary // Send full summary, not truncated
          };
        } catch {
          return {
            name: report.name,
            summary: 'Analysis data available'
          };
        }
      }).filter(Boolean);

      const requestData = {
        user_question: userMessage,
        user_email: user.email,
        reports: selectedReportsData
      };

      console.log('Sending chat request:', requestData);

      const response = await fetch(API_ENDPOINTS.ANALYSIS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Chat API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Chat response:', result);

      // Add bot response to chat
      setChatMessages(prev => [...prev, { type: 'bot', message: result.msg }]);

    } catch (error) {
      console.error('Error in chat:', error);
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        message: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const restartChatbot = () => {
    setChatMessages([]);
    setChatInput('');
    setChatLoading(false);
    // Re-initialize with welcome message
    setChatMessages([{
      type: 'bot',
      message: `Hello! I can help you compare ${selectedReports.length} reports. You can ask me questions about:

• Infrastructure scores and trends
• Environmental factors  
• Economic viability
• Overall performance comparison
• Specific insights from any report

What would you like to know?`
    }]);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            View and manage your hydrogen site analysis reports
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Logged in as: {user.email}
          </div>
        </div>
        <Button
          onClick={handleCompareReports}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          disabled={reports.length < 2}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Compare Reports</span>
        </Button>
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

      {/* Compare Reports Modal */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Select Reports to Compare</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select at least 2 reports to compare. You'll be able to ask questions about these reports using our AI chatbot.
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={report.id}
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={(checked) => 
                      handleReportSelection(report.id, checked as boolean)
                    }
                  />
                  <label htmlFor={report.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Report ID: {report.id}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedReports.length} report(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCompareModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartComparison}
                  disabled={selectedReports.length < 2}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Comparison
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatbot Modal */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Bot className="w-5 h-5 text-blue-400" />
              <span>Report Comparison Assistant</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-96">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 border border-gray-600 shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm text-gray-100">{msg.message}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 border border-gray-600 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                      <span className="text-sm text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Ask a question about the selected reports..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatLoading}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={restartChatbot}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Restart Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowChatbot(false);
                setChatMessages([]);
                setChatInput('');
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Close Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};