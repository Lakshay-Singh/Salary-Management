import { CountryNotFoundError } from '../errors';
import type { AnalyticsRepository, CountryStats, JobTitleStats } from '../repositories/analytics.repository';

export interface AnalyticsService {
  countryStats(): Promise<CountryStats[]>;
  jobTitleStats(countryCode: string): Promise<JobTitleStats[]>;
}

interface AnalyticsServiceDependencies {
  analytics: AnalyticsRepository;
}

export function createAnalyticsService({ analytics }: AnalyticsServiceDependencies): AnalyticsService {
  return {
    countryStats: () => analytics.getCountryStats(),

    async jobTitleStats(countryCode) {
      const stats = await analytics.getJobTitleStats(countryCode);
      if (!stats) throw new CountryNotFoundError(countryCode);
      return stats;
    },
  };
}
