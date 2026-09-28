import type { Country, CountryRepository } from '../../src/repositories/country.repository';
import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  EmployeeListResult,
  EmployeeRepository,
} from '../../src/repositories/employee.repository';

export const TEST_COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', currencyCode: 'INR' },
  { code: 'US', name: 'United States', currencyCode: 'USD' },
];

export class InMemoryCountryRepository implements CountryRepository {
  constructor(private readonly countries: Country[] = TEST_COUNTRIES) {}

  async findByCode(code: string): Promise<Country | null> {
    return this.countries.find((country) => country.code === code) ?? null;
  }
}

export class InMemoryEmployeeRepository implements EmployeeRepository {
  private readonly employees = new Map<number, Employee>();
  private nextId = 1;

  async create(input: EmployeeInput): Promise<Employee> {
    const employee = { id: this.nextId++, ...input };
    this.employees.set(employee.id, employee);
    return { ...employee };
  }

  async findById(id: number): Promise<Employee | null> {
    const employee = this.employees.get(id);
    return employee ? { ...employee } : null;
  }

  async update(id: number, input: EmployeeInput): Promise<Employee | null> {
    if (!this.employees.has(id)) return null;
    const employee = { id, ...input };
    this.employees.set(id, employee);
    return { ...employee };
  }

  async delete(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  async list({
    page,
    pageSize,
    search,
    countryCode,
    jobTitle,
    sortBy,
    sortOrder = 'asc',
  }: EmployeeListQuery): Promise<EmployeeListResult> {
    const needle = search?.toLowerCase();
    const matching = [...this.employees.values()].filter(
      (employee) =>
        (!countryCode || employee.countryCode === countryCode) &&
        (!jobTitle || employee.jobTitle === jobTitle) &&
        (!needle || employee.fullName.toLowerCase().includes(needle)),
    );

    const direction = sortOrder === 'desc' ? -1 : 1;
    matching.sort((a, b) => (sortBy ? direction * compare(a[sortBy], b[sortBy]) : 0) || a.id - b.id);

    const start = (page - 1) * pageSize;
    return {
      data: matching.slice(start, start + pageSize).map((employee) => ({ ...employee })),
      total: matching.length,
    };
  }
}

function compare(a: string | number, b: string | number): number {
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
}
