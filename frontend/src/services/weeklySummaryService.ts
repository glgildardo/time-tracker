import { api } from '@/lib/api';
import type { WeeklySummaryResponse } from '@/types';

export const weeklySummaryService = {
  /**
   * Get weekly summary of time entries grouped by task
   * @param weekStart Optional week start date in YYYY-MM-DD format. Defaults to current week.
   */
  async getWeeklySummary(weekStart?: string): Promise<WeeklySummaryResponse> {
    const params = weekStart ? { weekStart } : {};
    const response = await api.get('/time-entries/weekly-summary', { params });
    return response.data;
  },

  /**
   * Download weekly summary as CSV file
   * @param weekStart Optional week start date in YYYY-MM-DD format. Defaults to current week.
   */
  async downloadWeeklySummaryCSV(weekStart?: string): Promise<void> {
    const params = weekStart ? { weekStart } : {};
    const response = await api.get('/time-entries/weekly-summary/csv', {
      params,
      responseType: 'blob', // Important for file downloads
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'weekly-summary.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

