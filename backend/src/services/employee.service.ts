import { EmployeeNotFoundError, ValidationError } from '../errors';
import type { Country, CountryRepository } from '../repositories/country.repository';
import type { Employee, EmployeeInput, EmployeeRepository } from '../repositories/employee.repository';

export interface EmployeeWithCurrency extends Employee {
  currencyCode: string;
}

export interface EmployeeService {
  create(input: EmployeeInput): Promise<EmployeeWithCurrency>;
  getById(id: number): Promise<EmployeeWithCurrency>;
  update(id: number, input: EmployeeInput): Promise<EmployeeWithCurrency>;
  delete(id: number): Promise<void>;
}

interface EmployeeServiceDependencies {
  employees: EmployeeRepository;
  countries: CountryRepository;
}

export function createEmployeeService({ employees, countries }: EmployeeServiceDependencies): EmployeeService {
  async function knownCountry(code: string): Promise<Country> {
    const country = await countries.findByCode(code);
    if (!country) {
      throw new ValidationError([{ field: 'countryCode', message: 'Unknown country' }]);
    }
    return country;
  }

  // Currency is never stored on the employee: it always comes from the employee's country
  const withCurrency = (employee: Employee, country: Country): EmployeeWithCurrency => ({
    ...employee,
    currencyCode: country.currencyCode,
  });

  return {
    async create(input) {
      const country = await knownCountry(input.countryCode);
      return withCurrency(await employees.create(input), country);
    },

    async getById(id) {
      const employee = await employees.findById(id);
      if (!employee) throw new EmployeeNotFoundError(id);

      const country = await countries.findByCode(employee.countryCode);
      if (!country) {
        throw new Error(`Employee ${id} references country ${employee.countryCode}, which does not exist`);
      }
      return withCurrency(employee, country);
    },

    async update(id, input) {
      const country = await knownCountry(input.countryCode);
      const employee = await employees.update(id, input);
      if (!employee) throw new EmployeeNotFoundError(id);
      return withCurrency(employee, country);
    },

    async delete(id) {
      const deleted = await employees.delete(id);
      if (!deleted) throw new EmployeeNotFoundError(id);
    },
  };
}
