import { createApp, type Repositories } from './app';
import { loadConfig, type Config } from './config/config';

let config: Config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// Placeholders until the Prisma repositories are built (next increment):
// the API still boots, and employee endpoints answer 500 rather than the build breaking.
const notBuiltYet = (): Promise<never> => Promise.reject(new Error('Database repositories are not built yet'));
const repositories: Repositories = {
  employees: { create: notBuiltYet, findById: notBuiltYet, update: notBuiltYet, delete: notBuiltYet },
  countries: { findByCode: notBuiltYet },
};

createApp({ config, repositories }).listen(config.port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`API listening on port ${config.port} (${config.nodeEnv})`);
});
