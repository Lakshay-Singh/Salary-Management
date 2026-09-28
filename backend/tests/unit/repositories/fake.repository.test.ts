import { describeCountryRepositoryContract } from '../../contracts/countryRepository.contract';
import { describeEmployeeRepositoryContract } from '../../contracts/employeeRepository.contract';
import { InMemoryCountryRepository, InMemoryEmployeeRepository } from '../../helpers/fakeRepositories';

// The same contracts the Prisma repositories pass in tests/integration: the fakes used by the API tests cannot drift from Postgres
describeEmployeeRepositoryContract('InMemoryEmployeeRepository', async () => new InMemoryEmployeeRepository());

describeCountryRepositoryContract('InMemoryCountryRepository', async (countries) => new InMemoryCountryRepository(countries));
