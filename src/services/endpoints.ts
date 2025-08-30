// API Endpoints Configuration
// This file contains all API endpoint URLs for easy management and updates

export const API_ENDPOINTS = {
  // Asset Management Endpoints
  ASSETS: {
    CREATE: 'http://10.205.1.222:8000/api/v3/assets/',
    UPDATE: 'http://10.205.1.222:8000/api/v3/assets/',
    DELETE: 'http://10.205.1.222:8000/api/v3/assets/',
    GET_ALL: 'http://10.205.1.222:8000/api/v3/assets/',
    GET_BY_ID: 'http://10.205.1.222:8000/api/v3/assets/'
  },
  
  // Location Services
  LOCATION: {
    GEOCODE: '/api/location/geocode',
    REVERSE_GEOCODE: '/api/location/reverse-geocode',
    TRACKING: '/api/location-tracking' // when user clicking on any location 
  },
  
  // Analysis Services
  ANALYSIS: {
    HYDROGEN_POTENTIAL: '/api/analysis/hydrogen-potential',
    SITE_ANALYSIS: '/api/analysis/site',
    RECOMMENDATION_ANALYSIS: '/api/recommendation-analysis' // data sent after clicking on the analyze button after popup
  }
};

// Base API URL - can be changed for different environments
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to replace URL parameters
export const replaceUrlParams = (url: string, params: Record<string, string>): string => {
  let result = url;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};
