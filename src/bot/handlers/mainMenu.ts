import { UserRefactorRepository } from "../../db/repository/UserRefactorRepositery";
import { Context, Markup } from 'telegraf';
import { InlineKeyboardMarkup } from "node-telegram-bot-api";
import logger from '../../utils/logger';

async function mainMenu(ctx: Context) {

    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
  
    if (!chatId || !userId || !username) {
      await ctx.reply("Unable to identify user. Please try again.");
      return;
    }

  try {
    let user = await UserRefactorRepository.getUserByTelegramId(userId);
    if (!user) {
      await UserRefactorRepository.addPartialUser({
        telegram_id: userId,
        telegram_username: username,
        slippage: 500,
        buy_size: 100000,
      });
      user = await UserRefactorRepository.getUserByTelegramId(userId);
    }

    const replyMarkup: InlineKeyboardMarkup = getKeyboardMarkup(user);
    const buttons = buildMainMenuButtons(user, username);

    const message = `
Welcome to *Awesome Solana Trader*\\! 🚀

Your go\\-to Telegram bot for seamless Solana token trading\\.
Buy, sell, and manage your portfolio with automated stop loss and take profit orders\\.

*Features at Your Fingertips:*
• 💼 Real\\-time Portfolio Tracking
• ⚡ Lightning\\-fast Jupiter DEX Integration
• 🛡️ Automated Stop Loss & Take Profit
• 🎯 Customizable Slippage & Priority Fees

Let\\'s trade smarter, together\\!
    `;

    await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard(buttons));

  } catch (error) {
    logger.error({ error }, "Error in mainMenu");
    await ctx.reply("An error occurred. Please try again later.");
  }
}

function buildMainMenuButtons(user: any, username: string) {
    const buttons = [
      [
        Markup.button.callback('⚙️ Buy Settings', 'show_new_buy_settings'),
        Markup.button.callback('⚙️ Sell Settings', 'show_new_sell_settings'),
      ],
      [Markup.button.callback('💼 Positions', 'show_ciccio')],
      [Markup.button.callback('🛒 Buy', 'buy_coin')],
    ];

    if (!user?.private_key) {
      buttons.push([Markup.button.callback('🛡️ Set Wallet', 'set_wallet_first')]);
    }

    return buttons;
  }

function getKeyboardMarkup(user: any): InlineKeyboardMarkup {
  const walletShow = user?.private_key;

  const keyboard: any[] = [
    [
      { text: "⚙️ Buy Settings", callback_data: "show_new_buy_settings" },
      { text: "⚙️ Sell Settings", callback_data: "show_new_sell_settings" },
    ],
    [
      { text: "💼 Positions", callback_data: "show_ciccio" },
    ],
    [
      { text: "🛒 Buy", callback_data: "buy_coin" },
    ],
  ];

  if (!walletShow) {
    keyboard.push([
      { text: "🛡️ Set Wallet", callback_data: "set_wallet_first" },
    ]);
  }

  return { inline_keyboard: keyboard };
}

export { mainMenu };
