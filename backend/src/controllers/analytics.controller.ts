import type { RequestHandler } from 'express';
import type { CountryStats, JobTitleStats } from '../repositories/analytics.repository';
import type { AnalyticsService } from '../services/analytics.service';
import type { NoParams } from './types';

type CountryParams = { countryCode: string };

export function createAnalyticsController(service: AnalyticsService) {
  const countryStats: RequestHandler<NoParams, CountryStats[]> = async (_req, res) => {
    res.status(200).json(await service.countryStats());
  };

  const jobTitleStats: RequestHandler<CountryParams, JobTitleStats[]> = async (req, res) => {
    res.status(200).json(await service.jobTitleStats(req.params.countryCode));
  };

  return { countryStats, jobTitleStats };
}

export type AnalyticsController = ReturnType<typeof createAnalyticsController>;
