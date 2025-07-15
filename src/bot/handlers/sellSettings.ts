import { Markup } from 'telegraf';
import { UserRefactorRepository } from "../../db/repository/UserRefactorRepositery";
import { Steps } from "./steps";
import logger from '../../utils/logger';
export async function showNewSellSettings(ctx: any): Promise<number> {
    const userId = ctx.from?.id;
    logger.info({ data: ctx.state }, "Session state here is ");
    if (!userId) {
      await ctx.reply("Unable to identify user. Please try again.");
      return Steps.SellConfigSettings.MAIN_MENU_SELL; // Placeholder step for main menu or fallback
    }
    try {
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (!user) {
        await ctx.reply("User not found. Returning to the main menu.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Placeholder step for main menu
      }
      // Create buttons for each threshold and percentage manually
      const buttons = [
        [
          Markup.button.callback(
            `${user.threshold_1 >= 0 ? 'TP' : 'SL'} ${user.threshold_1}%`,
            'ask_threshold_1'
          ),
          Markup.button.callback(
            `Sell ${user.perc_1}%`,
            'ask_perc_1'
          ),
        ],
        [
          Markup.button.callback(
            `${user.threshold_2 >= 0 ? 'TP' : 'SL'} ${user.threshold_2}%`,
            'ask_threshold_2'
          ),
          Markup.button.callback(
            `Sell ${user.perc_2}%`,
            'ask_perc_2'
          ),
        ],
        [
          Markup.button.callback(
            `${user.threshold_3 >= 0 ? 'TP' : 'SL'} ${user.threshold_3}%`,
            'ask_threshold_3'
          ),
          Markup.button.callback(
            `Sell ${user.perc_3}%`,
            'ask_perc_3'
          ),
        ],
        // Add the back button
        [
          Markup.button.callback('🔙 Back', 'back'),
        ],
      ];
      if (ctx.callbackQuery) {
        const message = "Select your sell settings";
        await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
      } else {
        const message = "Select your sell settings";
        await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard(buttons));
      }
      return Steps.SellConfigSettings.NEW_SELL_SETTINGS_MENU; // Placeholder step for NEW_SELL_SETTINGS_MENU
    } catch (error) {
      logger.error({ data: error }, "Error in showNewSellSettings:");
      await ctx.reply("An error occurred. Please try again later.");
      return Steps.SellConfigSettings.MAIN_MENU_SELL; // Placeholder step for main menu or fallback
    }
  }
  export async function askThreshold1(ctx: any): Promise<number> {
    logger.info("Ask threshold 1");
    const message = "Insert Threshold 1 Percentage (e.g., 50 for TP or -50 for SL)";
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_THRES_1; 
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); 
    }
  }
  export async function setThreshold1(ctx: any): Promise<number> {
    try {
      logger.info("Set threshold 1");
      const userId = ctx.from?.id;
      const thresholdInput = ctx.message?.text;
      if (!userId || !thresholdInput || isNaN(Number(thresholdInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Threshold 1.");
        return Steps.SellConfigSettings.SET_THRES_1; // Stay in the current step
      }
      const thresholdValue = Number(thresholdInput); 
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's threshold_1 in the database
        await UserRefactorRepository.updateThreshold1(userId, thresholdValue);
        await ctx.reply("Threshold 1 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting threshold 1:");
      await ctx.reply("Set threshold 1 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function askThreshold2(ctx: any): Promise<number> {
    logger.info("Ask threshold 2");
    const message = "Insert Threshold 2 Percentage (e.g., 50 for TP or -50 for SL)";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_THRES_2; // Move to the INSERT_THRESHOLD_2 step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function setThreshold2(ctx: any): Promise<number> {
    try {
      logger.info("Set threshold 2");
      const userId = ctx.from?.id;
      const thresholdInput = ctx.message?.text;
      if (!userId || !thresholdInput || isNaN(Number(thresholdInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Threshold 1.");
        return Steps.SellConfigSettings.SET_THRES_2; // Stay in the current step
      }
      const thresholdValue = Number(thresholdInput); // Convert input to number
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's threshold_1 in the database
        await UserRefactorRepository.updateThreshold2(userId, thresholdValue);
        await ctx.reply("Threshold 2 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting threshold 2:");
      await ctx.reply("Set threshold 2 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function askThreshold3(ctx: any): Promise<number> {
    logger.info("Ask threshold 3");
    const message = "Insert Threshold 3 Percentage (e.g., 50 for TP or -50 for SL)";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_THRES_3; // Move to the INSERT_THRESHOLD_3 step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function setThreshold3(ctx: any): Promise<number> {
    try {
      logger.info("Set threshold 3");
      const userId = ctx.from?.id;
      const thresholdInput = ctx.message?.text;
      if (!userId || !thresholdInput || isNaN(Number(thresholdInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Threshold 3.");
        return Steps.SellConfigSettings.SET_THRES_3; // Stay in the current step
      }
      const thresholdValue = Number(thresholdInput); // Convert input to number
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's threshold_1 in the database
        await UserRefactorRepository.updateThreshold3(userId, thresholdValue);
        await ctx.reply("Threshold 3 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting threshold 3:");
      await ctx.reply("Set threshold 3 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function askPerc1(ctx: any): Promise<number> {
    logger.info("Ask percentage 1");
    const message = "Insert Sell 1 Percentage (e.g., 50)";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_PERC_1; // Move to the INSERT_PERC_1 step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function setPerc1(ctx: any): Promise<number> {
    try {
      logger.info("Set percentage 1");
      const userId = ctx.from?.id;
      const percInput = ctx.message?.text;
      if (!userId || !percInput || isNaN(Number(percInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Sell 1.");
        return Steps.SellConfigSettings.SET_PERC_1; // Stay in the current step
      }
      const percValue = Number(percInput); // Convert input to number
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's perc_1 in the database
        await UserRefactorRepository.updatePerc1(userId, percValue);
        await ctx.reply("Sell 1 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting percentage 1:");
      await ctx.reply("Set percentage 1 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function askPerc2(ctx: any): Promise<number> {
    logger.info("Ask percentage 2");
    const message = "Insert Sell 2 Percentage (e.g., 50)";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_PERC_2; // Move to the INSERT_PERC_2 step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function setPerc2(ctx: any): Promise<number> {
    try {
      logger.info("Set percentage 2");
      const userId = ctx.from?.id;
      const percInput = ctx.message?.text;
      if (!userId || !percInput || isNaN(Number(percInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Sell 2.");
        return Steps.SellConfigSettings.SET_PERC_2; // Stay in the current step
      }
      const percValue = Number(percInput); // Convert input to number
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's perc_2 in the database
        await UserRefactorRepository.updatePerc2(userId, percValue);
        await ctx.reply("Sell 2 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting percentage 2:");
      await ctx.reply("Set percentage 2 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function askPerc3(ctx: any): Promise<number> {
    logger.info("Ask percentage 3");
    const message = "Insert Sell 3 Percentage (e.g., 50)";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_sell_settings")],
          ]),
        });
      }
      return Steps.SellConfigSettings.SET_PERC_3; // Move to the INSERT_PERC_3 step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }
  export async function setPerc3(ctx: any): Promise<number> {
    try {
      logger.info("Set percentage 3");
      const userId = ctx.from?.id;
      const percInput = ctx.message?.text;
      if (!userId || !percInput || isNaN(Number(percInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Sell 3.");
        return Steps.SellConfigSettings.SET_PERC_3; // Stay in the current step
      }
      const percValue = Number(percInput); // Convert input to number
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's perc_3 in the database
        await UserRefactorRepository.updatePerc3(userId, percValue);
        await ctx.reply("Sell 3 set successfully.");
        return showNewSellSettings(ctx); // Return to the sell settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.SellConfigSettings.MAIN_MENU_SELL; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting percentage 3:");
      await ctx.reply("Set percentage 3 failed. Please try again later.");
      return showNewSellSettings(ctx); // Return to the sell settings menu
    }
  }