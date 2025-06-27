import { Context } from 'telegraf';
import { mainMenu } from './mainMenu';
import logger from '../../utils/logger';

export async function backToMainMenu(ctx: Context): Promise<void> {
    try {
      if ('callbackQuery' in ctx && ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
  
      await mainMenu(ctx);
    } catch (error) {
      logger.error({ error }, 'Error in backToMainMenu');
      await ctx.reply('An error occurred while returning to the main menu. Please try again.');
    }
}