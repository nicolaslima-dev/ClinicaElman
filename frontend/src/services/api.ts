/**
 * Custom Backend API Client
 * This file is prepared to replace supabase.ts in the future.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  get: async (url: string) => {
    // const response = await fetch(`${API_BASE_URL}${url}`);
    // return response.json();
    return Promise.resolve({ data: 'Mock Data' });
  },
  post: async (url: string, data: any) => {
    // const response = await fetch(`${API_BASE_URL}${url}`, {
    //   method: 'POST',
    //   body: JSON.stringify(data),
    //   headers: { 'Content-Type': 'application/json' }
    // });
    // return response.json();
    return Promise.resolve({ data: 'Mock Post Success' });
  }
};
