import { Router } from 'express';
import type { ReferenceController } from '../controllers/reference.controller';
import { validateQuery } from '../middleware/validate';
import { jobTitlesQuerySchema } from '../validation/reference.schemas';

export function referenceRouter(controller: ReferenceController): Router {
  return Router()
    .get('/countries', controller.listCountries)
    .get('/job-titles', validateQuery(jobTitlesQuerySchema), controller.listJobTitles);
}
