import { peerLabel, percentageDifference, type PeerLabel } from '../domain/peerPosition';
import { EmployeeNotFoundError, ValidationError } from '../errors';
import type { Country, CountryRepository } from '../repositories/country.repository';
import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  EmployeeRepository,
} from '../repositories/employee.repository';

export interface EmployeeWithCurrency extends Employee {
  currencyCode: string;
}

export interface EmployeePage {
  data: EmployeeWithCurrency[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** peerAverage and percentageDiff are null when there are too few peers to compare against. */
export interface PeerPosition {
  peerCount: number;
  peerAverage: number | null;
  percentageDiff: number | null;
  label: PeerLabel;
}

export interface EmployeeService {
  list(query: EmployeeListQuery): Promise<EmployeePage>;
  getPeerPosition(id: number): Promise<PeerPosition>;
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

  // A stored employee's country always exists (the foreign key guarantees it), so a miss is a bug, not bad input
  async function existingCountry(code: string): Promise<Country> {
    const country = await countries.findByCode(code);
    if (!country) {
      throw new Error(`Country ${code} is referenced by an employee but does not exist`);
    }
    return country;
  }

  // One lookup per distinct country, however many employees on the page share it
  function countryLookupOncePerCode(): (code: string) => Promise<Country> {
    const lookups = new Map<string, Promise<Country>>();
    return (code) => {
      let lookup = lookups.get(code);
      if (!lookup) {
        lookup = existingCountry(code);
        lookups.set(code, lookup);
      }
      return lookup;
    };
  }

  // Currency is never stored on the employee: it always comes from the employee's country
  const withCurrency = (employee: Employee, country: Country): EmployeeWithCurrency => ({
    ...employee,
    currencyCode: country.currencyCode,
  });

  return {
    async list(query) {
      const { data, total } = await employees.list(query);
      const countryOf = countryLookupOncePerCode();

      return {
        data: await Promise.all(data.map(async (employee) => withCurrency(employee, await countryOf(employee.countryCode)))),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      };
    },

    async getPeerPosition(id) {
      const employee = await employees.findById(id);
      if (!employee) throw new EmployeeNotFoundError(id);

      const { peerCount, peerAverage } = await employees.getPeerStats(id);
      const label = peerLabel(employee.salary, peerAverage ?? 0, peerCount);
      if (label === 'Not enough peers' || peerAverage === null) {
        return { peerCount, peerAverage: null, percentageDiff: null, label: 'Not enough peers' };
      }

      // The label and the difference use the exact average; only the average shown to the user is rounded
      return {
        peerCount,
        peerAverage: Math.round(peerAverage),
        percentageDiff: percentageDifference(employee.salary, peerAverage),
        label,
      };
    },

    async create(input) {
      const country = await knownCountry(input.countryCode);
      return withCurrency(await employees.create(input), country);
    },

    async getById(id) {
      const employee = await employees.findById(id);
      if (!employee) throw new EmployeeNotFoundError(id);
      return withCurrency(employee, await existingCountry(employee.countryCode));
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
