import { Router } from 'express';
import type { AnalyticsController } from '../controllers/analytics.controller';

export function analyticsRouter(controller: AnalyticsController): Router {
  return Router()
    .get('/analytics/countries', controller.countryStats)
    .get('/analytics/countries/:countryCode/job-titles', controller.jobTitleStats);
}
