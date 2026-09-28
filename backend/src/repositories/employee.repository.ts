export interface EmployeeInput {
  fullName: string;
  jobTitle: string;
  countryCode: string;
  salary: number;
}

export interface Employee extends EmployeeInput {
  id: number;
}

export interface EmployeeRepository {
  create(input: EmployeeInput): Promise<Employee>;
  findById(id: number): Promise<Employee | null>;
  /** Resolves to null when no employee has this id. */
  update(id: number, input: EmployeeInput): Promise<Employee | null>;
  /** Resolves to false when no employee has this id. */
  delete(id: number): Promise<boolean>;
}
