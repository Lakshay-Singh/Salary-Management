import { PrismaClient } from '@prisma/client';
import { createApp, type Repositories } from './app';
import { loadConfig, type Config } from './config/config';
import { PrismaAnalyticsRepository } from './repositories/prisma/analytics.repository';
import { PrismaCountryRepository } from './repositories/prisma/country.repository';
import { PrismaEmployeeRepository } from './repositories/prisma/employee.repository';

let config: Config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const prisma = new PrismaClient();
const repositories: Repositories = {
  employees: new PrismaEmployeeRepository(prisma),
  countries: new PrismaCountryRepository(prisma),
  analytics: new PrismaAnalyticsRepository(prisma),
};

createApp({ config, repositories }).listen(config.port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`API listening on port ${config.port} (${config.nodeEnv})`);
});
