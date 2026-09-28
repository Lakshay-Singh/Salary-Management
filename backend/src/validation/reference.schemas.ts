import { z } from 'zod';

export const jobTitlesQuerySchema = z.object({
  countryCode: z.string().optional(),
});

export type JobTitlesParams = z.infer<typeof jobTitlesQuerySchema>;
