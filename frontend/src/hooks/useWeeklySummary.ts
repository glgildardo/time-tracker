import { useQuery, useMutation } from '@tanstack/react-query';
import { weeklySummaryService } from '@/services/weeklySummaryService';
import type { WeeklySummaryResponse } from '@/types';

const weeklySummaryQueryKey = {
  all: ['weeklySummary'],
  detail: (weekStart?: string) => [...weeklySummaryQueryKey.all, weekStart || 'current'],
};

/**
 * Hook to fetch weekly summary data
 * @param weekStart Optional week start date in YYYY-MM-DD format. Defaults to current week.
 */
export const useWeeklySummary = (weekStart?: string) => {
  return useQuery<WeeklySummaryResponse>({
    queryKey: weeklySummaryQueryKey.detail(weekStart),
    queryFn: async () => {
      const response = await weeklySummaryService.getWeeklySummary(weekStart);
      return response;
    },
  });
};

/**
 * Hook to download weekly summary as CSV
 */
export const useDownloadWeeklySummaryCSV = () => {
  return useMutation({
    mutationFn: async (weekStart?: string) => {
      await weeklySummaryService.downloadWeeklySummaryCSV(weekStart);
    },
  });
};

