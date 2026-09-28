export interface EmployeeInput {
  fullName: string;
  jobTitle: string;
  countryCode: string;
  salary: number;
}

export interface Employee extends EmployeeInput {
  id: number;
}

/** The only columns a list may be ordered by. Anything else is rejected before it reaches a query. */
export const EMPLOYEE_SORT_FIELDS = ['id', 'fullName', 'jobTitle', 'countryCode', 'salary'] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export interface EmployeeListQuery {
  page: number;
  pageSize: number;
  search?: string;
  countryCode?: string;
  jobTitle?: string;
  sortBy?: EmployeeSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeListResult {
  data: Employee[];
  total: number;
}

export interface EmployeeRepository {
  list(query: EmployeeListQuery): Promise<EmployeeListResult>;
  create(input: EmployeeInput): Promise<Employee>;
  findById(id: number): Promise<Employee | null>;
  /** Resolves to null when no employee has this id. */
  update(id: number, input: EmployeeInput): Promise<Employee | null>;
  /** Resolves to false when no employee has this id. */
  delete(id: number): Promise<boolean>;
}
