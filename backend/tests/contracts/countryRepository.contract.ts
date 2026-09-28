import type { Country, CountryRepository } from '../../src/repositories/country.repository';

const INDIA: Country = { code: 'IN', name: 'India', currencyCode: 'INR' };
const UNITED_STATES: Country = { code: 'US', name: 'United States', currencyCode: 'USD' };
const UNITED_KINGDOM: Country = { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP' };

/**
 * Behaviour every CountryRepository must have, whatever stores the data.
 * `setUp` runs before each test and must return a repository holding exactly the given countries.
 */
export function describeCountryRepositoryContract(
  name: string,
  setUp: (countries: Country[]) => Promise<CountryRepository>,
): void {
  describe(`${name} fulfils the CountryRepository contract`, () => {
    let repository: CountryRepository;

    beforeEach(async () => {
      repository = await setUp([INDIA, UNITED_STATES, UNITED_KINGDOM]);
    });

    it('finds a country by code, returning exactly its code, name and currency', async () => {
      expect(await repository.findByCode('IN')).toEqual(INDIA);
    });

    it('returns null for a code that is not a supported country', async () => {
      expect(await repository.findByCode('XX')).toBeNull();
    });

    it('returns every supported country', async () => {
      const byCode = (a: Country, b: Country) => a.code.localeCompare(b.code);

      expect((await repository.findAll()).sort(byCode)).toEqual([UNITED_KINGDOM, INDIA, UNITED_STATES]);
    });
  });
}
