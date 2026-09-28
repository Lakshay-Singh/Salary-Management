import { z } from 'zod';
import { EMPLOYEE_SORT_FIELDS } from '../repositories/employee.repository';

const requiredText = z.string({ error: 'is required' }).trim().min(1, 'is required');

// Used for both POST and PUT: an update replaces every editable field. Unknown keys such as currencyCode are dropped.
export const employeeSchema = z.object({
  fullName: requiredText,
  jobTitle: requiredText,
  countryCode: z.string({ error: 'is required' }),
  salary: z.number({ error: 'must be a number' }).int('must be a whole number').positive('must be greater than 0'),
});

export type EmployeeRequest = z.infer<typeof employeeSchema>;

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().optional(),
  countryCode: z.string().optional(),
  jobTitle: z.string().optional(),
  sortBy: z.enum(EMPLOYEE_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeListParams = z.infer<typeof employeeListQuerySchema>;
