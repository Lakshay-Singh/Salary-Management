import type { CountryRepository } from '../repositories/country.repository';
import type { EmployeeRepository } from '../repositories/employee.repository';

export interface CountrySummary {
  countryCode: string;
  name: string;
  currencyCode: string;
}

export interface ReferenceService {
  listCountries(): Promise<CountrySummary[]>;
  listJobTitles(countryCode?: string): Promise<string[]>;
}

interface ReferenceServiceDependencies {
  employees: EmployeeRepository;
  countries: CountryRepository;
}

const alphabetically = (a: string, b: string) => a.localeCompare(b);

/** Lists that feed dropdowns and filters: sorted here, so the order never depends on the repository. */
export function createReferenceService({ employees, countries }: ReferenceServiceDependencies): ReferenceService {
  return {
    async listCountries() {
      const all = await countries.findAll();
      return all
        .map(({ code, name, currencyCode }) => ({ countryCode: code, name, currencyCode }))
        .sort((a, b) => alphabetically(a.name, b.name));
    },

    async listJobTitles(countryCode) {
      const titles = await employees.getJobTitles(countryCode);
      return [...titles].sort(alphabetically);
    },
  };
}
