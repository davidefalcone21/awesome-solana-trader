import { Markup } from 'telegraf';
import { UserRefactorRepository } from "../../db/repository/UserRefactorRepositery";
import { Steps } from "./steps";
import { BotContext } from "../../types/context";
import logger from "../../utils/logger";
export async function showNewBuySettings(ctx: BotContext): Promise<number> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Unable to identify user. Please try again.");
    return Steps.BuyConfigSettings.MAIN_MENU_BUY;
  }
  try {
    const user = await UserRefactorRepository.getUserByTelegramId(userId);
    if (!user) {
      await ctx.reply("User not found. Returning to the main menu.");
      return Steps.BuyConfigSettings.MAIN_MENU_BUY;
    }
    const slippagePerc = fromDbToPercSlip(user.slippage);
    const buySizeSol = fromDbToSol(user.buy_size);
    const priorityFeeSol = fromDbToSol(user.priority_fee);
    const buttons = [
      [Markup.button.callback(`Buy Size - ${buySizeSol} SOL`, 'set_buysize_new')],
      [Markup.button.callback(`Slippage - ${slippagePerc}%`, 'set_slippage_new')],
      [Markup.button.callback(`Priority Fee - ${priorityFeeSol} SOL`, 'set_priority_fee_new')],
      [Markup.button.callback("🔙 Back", 'back')],
    ];
    if (ctx.callbackQuery) {
        const message = "Select your buy settings"
        await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
    } else {
      const message = "Select your buy settings"
      await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard(buttons));
    }
    return Steps.BuyConfigSettings.NEW_BUY_SETTINGS_MENU;
  } catch (error) {
    logger.error({ error }, "Error in showNewBuySettings");
    await ctx.reply("An error occurred. Please try again later.");
    return Steps.BuyConfigSettings.MAIN_MENU_BUY;
  }
}
export async function setBuySizeNew(ctx: BotContext): Promise<number> {
  const message = "Insert Buy Size in SOL";
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Back", "back_buy_settings")],
      ]));
    } else {
      await ctx.reply(message, Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Back", "back_buy_settings")],
      ]));
    }
    return Steps.BuyConfigSettings.SET_BUYSIZE;
  } catch (error) {
    logger.error({ error }, "Error updating message in setBuySizeNew");
    return showNewBuySettings(ctx);
  }
}
  export async function setBuySizeAmount(ctx: any): Promise<number> {
    try {
      logger.info("Set buysize amount");
      const userId = ctx.from?.id;
      const buySizeInput = ctx.message?.text;
      if (!userId || !buySizeInput || isNaN(Number(buySizeInput))) {
        await ctx.reply("Invalid input. Please enter a valid number for Buy Size in SOL.");
        return Steps.BuyConfigSettings.SET_BUYSIZE; 
      }
      const buySizeDb = fromSolToDb(Number(buySizeInput)); 
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        await UserRefactorRepository.updateBuySize(userId, buySizeDb);
        await ctx.reply("Buy Size set successfully.");
        return showNewBuySettings(ctx); 
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.BuyConfigSettings.MAIN_MENU_BUY;
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting buy size:");
      await ctx.reply("Set Buy Size failed. Please try again later.");
      return showNewBuySettings(ctx);
    }
  }
  export async function setSlippageNew(ctx: any): Promise<number> {
    logger.info("Set slippage new");
    const message = "Insert Slippage Percentage";
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_buy_settings")],
          ]),
        });
      } else {
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_buy_settings")],
          ]),
        });
      }
      return Steps.BuyConfigSettings.SET_SLIPPAGE; 
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return showNewBuySettings(ctx); 
    }
  }
  export async function setSlippagePerc(ctx: any): Promise<number> {
    try {
      logger.info("Set slippage percentage");
      const userId = ctx.from?.id;
      const slippageInput = ctx.message?.text;
      if (!userId || !slippageInput || isNaN(Number(slippageInput))) {
        await ctx.reply("Invalid input. Please enter a valid percentage for Slippage.");
        return Steps.BuyConfigSettings.SET_SLIPPAGE; 
      }
      const slippageDb = fromPercSlipToDb(Number(slippageInput)); 
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        await UserRefactorRepository.updateSlippage(userId, slippageDb);
        await ctx.reply("Slippage set successfully.");
        return showNewBuySettings(ctx);
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.BuyConfigSettings.MAIN_MENU_BUY;
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting slippage:");
      await ctx.reply("Set slippage failed. Please try again later.");
      return showNewBuySettings(ctx); 
    }
  }
  export async function setPriorityFeeNew(ctx: any): Promise<number> {
    logger.info("Set Priority Fee new");
    const message = "Insert Priority Fee in SOL";
    try {
      // If the request comes from a callback query, edit the existing message
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_buy_settings")],
          ]),
        });
      } else {
        // If triggered from a standard message, send a new message
        await ctx.reply(message, {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back", "back_buy_settings")],
          ]),
        });
      }
      return Steps.BuyConfigSettings.SET_PRIORITY_FEE; // Move to the SET_PRIORITY_FEE step
    } catch (error) {
      logger.error({ data: error }, "Error updating message:");
      return Steps.BuyConfigSettings.NEW_BUY_SETTINGS_MENU; // Fallback to the buy settings menu
    }
  }
  export async function setPriorityFeeAmount(ctx: any): Promise<number> {
    try {
      logger.info("Set priority fee amount");
      const userId = ctx.from?.id;
      const priorityFeeInput = ctx.message?.text;
      if (!userId || !priorityFeeInput || isNaN(Number(priorityFeeInput))) {
        await ctx.reply("Invalid input. Please enter a valid number for Priority Fee in SOL.");
        return Steps.BuyConfigSettings.SET_PRIORITY_FEE; // Stay in the current step
      }
      const priorityFeeDb = fromSolToDb(Number(priorityFeeInput)); // Convert SOL to DB-compatible value
      const user = await UserRefactorRepository.getUserByTelegramId(userId);
      if (user) {
        // Update the user's priority fee in the database
        await UserRefactorRepository.updatePriorityFee(userId, priorityFeeDb);
        await ctx.reply("Priority Fee set successfully.");
        return showNewBuySettings(ctx); // Return to the buy settings menu
      } else {
        await ctx.reply("Please use /start to register first.");
        return Steps.BuyConfigSettings.MAIN_MENU_BUY; // Return to the main menu
      }
    } catch (error) {
      logger.error({ data: error }, "Error setting priority fee:");
      await ctx.reply("Set Priority Fee failed. Please try again later.");
      return showNewBuySettings(ctx); // Return to the buy settings menu
    }
  }
  function fromPercSlipToDb(percentage: number): number {
    return percentage * 100; 
  }
// Conversion helper functions
function fromDbToPercSlip(slippage: number): number {
  return slippage / 100; // Example: 500 -> 5%
}
function fromDbToSol(value: number): number {
  return value / 1e9; 
}
// Helper function to convert SOL to a DB-compatible format
function fromSolToDb(value: number): number {
    return value * 1e9; // Convert SOL to lamports
  }