import { COUNTRIES, JOB_TITLES } from '../../../prisma/seed/data';
import { generateEmployees, salaryBand } from '../../../prisma/seed/generate';
import { MAX_DB_INTEGER } from '../../../src/domain/limits';

const employees = generateEmployees(10_000, 42);

describe('generateEmployees', () => {
  it('generates exactly the requested number of employees', () => {
    expect(employees).toHaveLength(10_000);
  });

  it('generates identical employees from the same seed, so every developer gets the same data', () => {
    expect(generateEmployees(10_000, 42)).toEqual(employees);
  });

  it('generates different employees from a different seed', () => {
    expect(generateEmployees(10_000, 7)).not.toEqual(employees);
  });

  it('places employees in every weighted country and none in a zero-weight country such as GB', () => {
    const countriesUsed = new Set(employees.map((employee) => employee.countryCode));

    for (const country of COUNTRIES) {
      expect({ country: country.code, hasEmployees: countriesUsed.has(country.code) }).toEqual({
        country: country.code,
        hasEmployees: country.headcountWeight > 0,
      });
    }
    expect(countriesUsed.has('GB')).toBe(false);
  });

  it('uses every job title', () => {
    const titlesUsed = new Set(employees.map((employee) => employee.jobTitle));

    expect([...titlesUsed].sort()).toEqual(JOB_TITLES.map((jobTitle) => jobTitle.title).sort());
  });

  it('gives each employee a whole-number salary inside the band for their country and title, within the database limit', () => {
    const outOfBand = employees.filter((employee) => {
      const country = COUNTRIES.find((candidate) => candidate.code === employee.countryCode);
      const jobTitle = JOB_TITLES.find((candidate) => candidate.title === employee.jobTitle);
      if (!country || !jobTitle) return true;
      const { min, max } = salaryBand(country, jobTitle);
      return !Number.isInteger(employee.salary) || employee.salary < min || employee.salary > max;
    });

    expect(outOfBand).toEqual([]);
    expect(Math.max(...employees.map((employee) => employee.salary))).toBeLessThanOrEqual(MAX_DB_INTEGER);
  });

  it('gives every employee a first and last name with no stray whitespace', () => {
    const badNames = employees.filter(
      (employee) => employee.fullName.trim() !== employee.fullName || !employee.fullName.includes(' '),
    );

    expect(badNames).toEqual([]);
  });
});
