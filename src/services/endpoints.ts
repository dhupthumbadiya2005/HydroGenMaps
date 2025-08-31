// API Endpoints Configuration
// This file contains all API endpoint URLs for easy management and updates

export const API_ENDPOINTS = {
  // Asset Management Endpoints
  ASSETS: {
    CREATE: 'http://192.168.1.6:8000/api/v3/assets/',
    UPDATE: 'http://192.168.1.6:8000/api/v3/assets/',
    DELETE: 'http://192.168.1.6:8000/api/v3/assets/',
    GET_ALL: 'http://192.168.1.6:8000/api/assets/list/',
    GET_BY_ID: 'http://192.168.1.6:8000/api/v3/assets/'
  },
  
  // Location Services
  LOCATION: {
    GEOCODE: '/api/location/geocode',
    REVERSE_GEOCODE: '/api/location/reverse-geocode',
    TRACKING: 'http://192.168.1.6:8000/api/explore/search/' // when user clicking on any location 
  },

  
  // Analysis Services
  ANALYSIS: {
    HYDROGEN_POTENTIAL: '/api/analysis/hydrogen-potential',
    SITE_ANALYSIS: '/api/analysis/site',
    RECOMMENDATION_ANALYSIS: 'http://192.168.1.6:8000/api/analysis/submit/' , // data sent after clicking on the analyze button after popup
  
    
    GET_RECOMMENDATION :'http://192.168.1.7:8007/analyse' ,//DATA WE GET TO SHOW USER recommendation

    SAVE_REPORT : 'http://192.168.1.6:8000/api/feedback/submit/' ,// SAVE REPORT POST REQ

    VIEW_REPORT : 'http://192.168.1.6:8000/api/feedback/list/' ,  // TO VIEW THE REPORT IN REPORT SECTION

    CHAT : 'http://192.168.1.7:8007/reports' // FOR CHATBOT
  }
};

//

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
