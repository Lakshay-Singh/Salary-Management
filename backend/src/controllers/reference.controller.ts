import type { RequestHandler } from 'express';
import type { CountrySummary, ReferenceService } from '../services/reference.service';
import type { JobTitlesParams } from '../validation/reference.schemas';

type NoParams = Record<string, string>;

export function createReferenceController(service: ReferenceService) {
  const listCountries: RequestHandler<NoParams, CountrySummary[]> = async (_req, res) => {
    res.status(200).json(await service.listCountries());
  };

  const listJobTitles: RequestHandler<NoParams, string[], unknown, unknown, { query: JobTitlesParams }> = async (
    _req,
    res,
  ) => {
    res.status(200).json(await service.listJobTitles(res.locals.query.countryCode));
  };

  return { listCountries, listJobTitles };
}

export type ReferenceController = ReturnType<typeof createReferenceController>;
