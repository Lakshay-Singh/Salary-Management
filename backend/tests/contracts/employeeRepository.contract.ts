import type { EmployeeInput, EmployeeRepository } from '../../src/repositories/employee.repository';

const ASHA: EmployeeInput = { fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_800_000 };

/**
 * Behaviour every EmployeeRepository must have, whatever stores the data.
 * `setUp` runs before each test and must return an empty repository in which countries IN and US exist.
 */
export function describeEmployeeRepositoryContract(name: string, setUp: () => Promise<EmployeeRepository>): void {
  describe(`${name} fulfils the EmployeeRepository contract`, () => {
    let repository: EmployeeRepository;

    beforeEach(async () => {
      repository = await setUp();
    });

    const given = async (...overrides: Partial<EmployeeInput>[]) => {
      const created = [];
      for (const override of overrides) {
        created.push(await repository.create({ ...ASHA, ...override }));
      }
      return created;
    };

    const numbered = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ fullName: `Employee ${String(index + 1).padStart(2, '0')}` }));

    const namesIn = (employees: { fullName: string }[]) => employees.map((employee) => employee.fullName);

    describe('create and findById', () => {
      it('stores the employee and returns exactly its fields with a new id', async () => {
        const created = await repository.create(ASHA);

        expect(created).toEqual({ id: expect.any(Number), ...ASHA });
        expect(await repository.findById(created.id)).toEqual(created);
      });

      it('gives every new employee its own id', async () => {
        const [first, second] = await given({}, {});

        expect(first.id).not.toBe(second.id);
      });

      it('returns null for an id that does not exist', async () => {
        expect(await repository.findById(999_999)).toBeNull();
      });
    });

    describe('update', () => {
      it('replaces every editable field and returns the stored result', async () => {
        const [existing] = await given({});
        const changes = { fullName: 'Asha Rao-Menon', jobTitle: 'Engineering Manager', countryCode: 'US', salary: 185_000 };

        const updated = await repository.update(existing.id, changes);

        expect(updated).toEqual({ id: existing.id, ...changes });
        expect(await repository.findById(existing.id)).toEqual({ id: existing.id, ...changes });
      });

      it('returns null for an id that does not exist', async () => {
        expect(await repository.update(999_999, ASHA)).toBeNull();
      });
    });

    describe('delete', () => {
      it('removes the employee and returns true', async () => {
        const [existing] = await given({});

        expect(await repository.delete(existing.id)).toBe(true);
        expect(await repository.findById(existing.id)).toBeNull();
      });

      it('returns false for an id that does not exist', async () => {
        expect(await repository.delete(999_999)).toBe(false);
      });
    });

    describe('list', () => {
      it('orders by id when no sort is given, returning exactly the employee fields', async () => {
        const created = await given({ fullName: 'Zoe Ward' }, { fullName: 'Adam Bell' });

        const result = await repository.list({ page: 1, pageSize: 25 });

        expect(result).toEqual({ data: created, total: 2 });
      });

      it('returns the requested page and the total across all pages', async () => {
        await given(...numbered(25));

        const result = await repository.list({ page: 2, pageSize: 10 });

        expect(namesIn(result.data)).toEqual(namesIn(numbered(25).slice(10, 20)));
        expect(result.total).toBe(25);
      });

      it('returns no rows but the real total for a page past the end', async () => {
        await given(...numbered(3));

        const result = await repository.list({ page: 99, pageSize: 10 });

        expect(result).toEqual({ data: [], total: 3 });
      });

      it('filters by exact country code and counts only the matches', async () => {
        await given(
          { fullName: 'Asha Rao', countryCode: 'IN' },
          { fullName: 'John Smith', countryCode: 'US' },
          { fullName: 'Emily Chen', countryCode: 'US' },
        );

        const result = await repository.list({ page: 1, pageSize: 25, countryCode: 'US' });

        expect(namesIn(result.data).sort()).toEqual(['Emily Chen', 'John Smith']);
        expect(result.total).toBe(2);
      });

      it('filters by exact job title, so "Software Engineer" does not match "Senior Software Engineer"', async () => {
        await given(
          { fullName: 'Asha Rao', jobTitle: 'Software Engineer' },
          { fullName: 'Dev Patel', jobTitle: 'Senior Software Engineer' },
        );

        const result = await repository.list({ page: 1, pageSize: 25, jobTitle: 'Software Engineer' });

        expect(namesIn(result.data)).toEqual(['Asha Rao']);
        expect(result.total).toBe(1);
      });

      it('combines filters with AND', async () => {
        await given(
          { fullName: 'Asha Rao', countryCode: 'IN', jobTitle: 'Software Engineer' },
          { fullName: 'Meera Iyer', countryCode: 'IN', jobTitle: 'Engineering Manager' },
          { fullName: 'John Smith', countryCode: 'US', jobTitle: 'Software Engineer' },
        );

        const result = await repository.list({ page: 1, pageSize: 25, countryCode: 'IN', jobTitle: 'Software Engineer' });

        expect(namesIn(result.data)).toEqual(['Asha Rao']);
        expect(result.total).toBe(1);
      });

      it('searches names by case-insensitive partial match', async () => {
        await given({ fullName: 'Asha Rao' }, { fullName: 'Rahul Sharma' }, { fullName: 'Maria Garcia' });

        const result = await repository.list({ page: 1, pageSize: 25, search: 'SHA' });

        expect(namesIn(result.data).sort()).toEqual(['Asha Rao', 'Rahul Sharma']);
        expect(result.total).toBe(2);
      });

      it.each(['%', '_'])('treats %p in a search as a literal character, not a wildcard', async (wildcard) => {
        await given({ fullName: 'Asha Rao' }, { fullName: 'Rahul Sharma' });

        const result = await repository.list({ page: 1, pageSize: 25, search: wildcard });

        expect(result).toEqual({ data: [], total: 0 });
      });

      it.each([
        ['asc', ['Low Earner', 'Mid Earner', 'High Earner']],
        ['desc', ['High Earner', 'Mid Earner', 'Low Earner']],
      ] as const)('sorts by salary %s', async (sortOrder, expectedNames) => {
        await given(
          { fullName: 'Mid Earner', salary: 2_000_000 },
          { fullName: 'High Earner', salary: 3_000_000 },
          { fullName: 'Low Earner', salary: 1_000_000 },
        );

        const result = await repository.list({ page: 1, pageSize: 25, sortBy: 'salary', sortOrder });

        expect(namesIn(result.data)).toEqual(expectedNames);
      });

      it('sorts by full name', async () => {
        await given({ fullName: 'Maria Garcia' }, { fullName: 'Asha Rao' }, { fullName: 'John Smith' });

        const result = await repository.list({ page: 1, pageSize: 25, sortBy: 'fullName' });

        expect(namesIn(result.data)).toEqual(['Asha Rao', 'John Smith', 'Maria Garcia']);
      });

      it('breaks ties by ascending id, so rows with equal values keep a stable order across pages', async () => {
        const [first, second, third, fourth] = await given(
          { salary: 1_000_000 },
          { salary: 2_000_000 },
          { salary: 1_000_000 },
          { salary: 2_000_000 },
        );

        const result = await repository.list({ page: 1, pageSize: 25, sortBy: 'salary', sortOrder: 'desc' });

        expect(result.data.map((employee) => employee.id)).toEqual([second.id, fourth.id, first.id, third.id]);
      });
    });

    describe('getPeerStats', () => {
      it('counts and averages peers with the same country and job title, excluding the employee', async () => {
        const [employee] = await given(
          { salary: 1_200_000 },
          { salary: 900_000 },
          { salary: 1_000_000 },
          { salary: 1_100_000 },
          { countryCode: 'US', salary: 200_000 },
          { jobTitle: 'Engineering Manager', salary: 5_000_000 },
        );

        expect(await repository.getPeerStats(employee.id)).toEqual({ peerCount: 3, peerAverage: 1_000_000 });
      });

      it('returns the exact average, without rounding', async () => {
        const [employee] = await given({ salary: 500_000 }, { salary: 100_000 }, { salary: 100_000 }, { salary: 100_001 });

        const stats = await repository.getPeerStats(employee.id);

        expect(stats.peerCount).toBe(3);
        expect(stats.peerAverage).toBeCloseTo(300_001 / 3, 6);
      });

      it('returns no peers and a null average when nobody shares the country and job title', async () => {
        const [employee] = await given({}, { countryCode: 'US' }, { jobTitle: 'Engineering Manager' });

        expect(await repository.getPeerStats(employee.id)).toEqual({ peerCount: 0, peerAverage: null });
      });
    });

    describe('getJobTitles', () => {
      it('returns each job title held by an employee once', async () => {
        await given(
          { jobTitle: 'Software Engineer' },
          { jobTitle: 'Data Analyst', countryCode: 'US' },
          { jobTitle: 'Software Engineer', countryCode: 'US' },
        );

        expect((await repository.getJobTitles()).sort()).toEqual(['Data Analyst', 'Software Engineer']);
      });

      it('returns only the titles held in the given country', async () => {
        await given(
          { jobTitle: 'Software Engineer', countryCode: 'IN' },
          { jobTitle: 'Engineering Manager', countryCode: 'IN' },
          { jobTitle: 'Data Analyst', countryCode: 'US' },
        );

        expect((await repository.getJobTitles('IN')).sort()).toEqual(['Engineering Manager', 'Software Engineer']);
      });

      it('returns an empty list for a country with no employees', async () => {
        await given({ countryCode: 'IN' });

        expect(await repository.getJobTitles('US')).toEqual([]);
      });
    });
  });
}
