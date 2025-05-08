export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const SERVER_PORT = parseInt(process.env.PORT || '5001', 10);

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}