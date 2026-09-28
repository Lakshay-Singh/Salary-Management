import { PrismaClient } from '@prisma/client';
import { createApp, type Repositories } from './app';
import { loadConfig, type Config } from './config/config';
import { PrismaAnalyticsRepository } from './repositories/prisma/analytics.repository';

let config: Config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const prisma = new PrismaClient();

// Employee and country repositories are placeholders until their Prisma versions are built:
// the API still boots, and those endpoints answer 500 rather than the build breaking.
const notBuiltYet = (): Promise<never> => Promise.reject(new Error('Database repositories are not built yet'));
const repositories: Repositories = {
  analytics: new PrismaAnalyticsRepository(prisma),
  employees: {
    list: notBuiltYet,
    create: notBuiltYet,
    findById: notBuiltYet,
    update: notBuiltYet,
    delete: notBuiltYet,
    getPeerStats: notBuiltYet,
    getJobTitles: notBuiltYet,
  },
  countries: { findByCode: notBuiltYet, findAll: notBuiltYet },
};

createApp({ config, repositories }).listen(config.port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`API listening on port ${config.port} (${config.nodeEnv})`);
});
