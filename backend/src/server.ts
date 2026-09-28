import { createApp } from './app';
import { loadConfig, type Config } from './config/config';

let config: Config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

createApp({ config }).listen(config.port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`API listening on port ${config.port} (${config.nodeEnv})`);
});
