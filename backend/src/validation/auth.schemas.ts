import { z } from 'zod';

const requiredString = z.string({ error: 'is required' }).min(1, 'is required');

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginRequest = z.infer<typeof loginSchema>;
