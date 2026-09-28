import { z } from 'zod';

const requiredText = z.string({ error: 'is required' }).trim().min(1, 'is required');

// Used for both POST and PUT: an update replaces every editable field. Unknown keys such as currencyCode are dropped.
export const employeeSchema = z.object({
  fullName: requiredText,
  jobTitle: requiredText,
  countryCode: z.string({ error: 'is required' }),
  salary: z.number({ error: 'must be a number' }).int('must be a whole number').positive('must be greater than 0'),
});

export type EmployeeRequest = z.infer<typeof employeeSchema>;
