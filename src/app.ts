import { startBot } from './bot/bot';
import { startStopLossMonitor } from './services/stopLossMonitor';
import logger from './utils/logger';

const main = () => {
  logger.info('Starting Awesome Solana Trader Bot');

  startBot();
  startStopLossMonitor();

  logger.info('All services started successfully');
};

main();
