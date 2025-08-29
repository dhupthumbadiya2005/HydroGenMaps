import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Download, Eye, Trash2, Search, Calendar, MapPin } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  location: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  size: string;
  analysisRadius: number;
  score: number;
}

// Mock report data
const mockReports: Report[] = [
  {
    id: '1',
    name: 'Houston Hydrogen Potential Analysis',
    location: 'Houston, TX, USA',
    generatedAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    size: '2.3 MB',
    analysisRadius: 15,
    score: 87
  },
  {
    id: '2',
    name: 'Los Angeles Green Energy Assessment',
    location: 'Los Angeles, CA, USA',
    generatedAt: '2024-01-20T14:45:00Z',
    status: 'completed',
    size: '1.8 MB',
    analysisRadius: 10,
    score: 74
  },
  {
    id: '3',
    name: 'Denver Industrial Zone Study',
    location: 'Denver, CO, USA',
    generatedAt: '2024-01-25T09:15:00Z',
    status: 'processing',
    size: '-',
    analysisRadius: 20,
    score: 0
  },
  {
    id: '4',
    name: 'Phoenix Solar-Hydrogen Integration',
    location: 'Phoenix, AZ, USA',
    generatedAt: '2024-01-28T16:20:00Z',
    status: 'completed',
    size: '3.1 MB',
    analysisRadius: 25,
    score: 92
  }
];

export const Reports: React.FC = () => {
  const [reports] = useState<Report[]>(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Report['status'] | 'all'>('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const handleView = (reportId: string) => {
    // Placeholder for view functionality
    console.log('Viewing report:', reportId);
  };

  const handleDownload = (reportId: string) => {
    // Placeholder for download functionality
    console.log('Downloading report:', reportId);
  };

  const handleDelete = (reportId: string) => {
    // Placeholder for delete functionality
    console.log('Deleting report:', reportId);
  };

  const completedReports = reports.filter(r => r.status === 'completed').length;
  const processingReports = reports.filter(r => r.status === 'processing').length;
  const avgScore = reports.filter(r => r.status === 'completed' && r.score > 0)
    .reduce((sum, r) => sum + r.score, 0) / completedReports || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View and manage your hydrogen site analysis reports
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-muted-foreground">Total Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedReports}</p>
              <p className="text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-accent">{Math.round(avgScore)}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-muted-foreground">Out of 100</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {(['all', 'completed', 'processing', 'failed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
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
                      <h3 className="text-lg font-semibold">{report.name}</h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      {report.status === 'completed' && report.score > 0 && (
                        <Badge variant="outline" className={getScoreColor(report.score)}>
                          Score: {report.score}/100
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{report.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(report.generatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          {report.analysisRadius}km radius • {report.size}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {report.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleView(report.id)}
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownload(report.id)}
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
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

                {report.status === 'processing' && (
                  <div className="mt-4 bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning"></div>
                      <span className="text-sm">Processing analysis...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Placeholder notice */}
      <Card className="bg-accent-light/20 border-accent/20">
        <CardContent className="p-4">
          <p className="text-sm text-center">
            🚀 <strong>Phase 2:</strong> Full report generation, PDF exports, and detailed analytics coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};