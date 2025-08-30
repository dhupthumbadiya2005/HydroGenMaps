# Hydrogen Site Analysis Report System

This directory contains the components for the hydrogen site analysis report system.

## Components

### AnalysisReportVisualization.tsx
The core visualization component that displays analysis results with:
- Overall score dashboard
- Core metrics grid with color-coded progress bars
- Bar chart for factor comparison
- Radar chart for comprehensive overview
- Parsed AI summary with insights and recommendations

### ReportModal.tsx
A modal wrapper that displays the analysis report with:
- Full-screen report visualization
- Save report functionality
- Download report as text file
- Close button

### types.ts
TypeScript interfaces for:
- API request/response formats
- Parsed analysis data
- Chart data structures

## Usage

### Basic Usage
```tsx
import { AnalysisReportVisualization, ReportModal } from '@/components/reports';

// Display report in a modal
<ReportModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  data={analysisData}
  location={locationData}
  userEmail="user@example.com"
/>

// Or use visualization component directly
<AnalysisReportVisualization 
  data={analysisData} 
  className="custom-styles" 
/>
```

### Data Format
The system expects analysis data in this format:
```json
{
  "s_infra": "0.056602588077022356",
  "s_env": "0.18231370825914084",
  "s_econ": "0.0",
  "s_avg": "0.07963876544538773",
  "s_xgboost_aggregate": "0.26122617721557617",
  "s_user_custom_pref": "0.20034778118133545",
  "ai_summary": "Based on the provided scores..."
}
```

## Features

- **Score Normalization**: Automatically converts 0-1 scores to 0-100% for display
- **Color Coding**: Red (<40%), Yellow (40-70%), Green (>70%)
- **AI Summary Parsing**: Automatically extracts insights and recommendations
- **Responsive Charts**: Uses Recharts library for professional visualizations
- **Export Options**: Save to backend API and download as text file
- **TypeScript Support**: Full type safety with proper interfaces

## Dependencies

- Recharts (for charts)
- Lucide React (for icons)
- shadcn/ui components
- Tailwind CSS for styling
