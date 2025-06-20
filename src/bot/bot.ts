import { Telegraf, Context } from 'telegraf';
import { TELEGRAM_TOKEN } from '../config';
import { mainMenu } from "./handlers/mainMenu";
import { backToMainMenu } from "./handlers/backMenu";
import { buyCoinStart, buy025Light, buy05Light, buy1Light, buyCoinGetAmount, buyCoinGetCA, confirmBuy } from "./handlers/buyConv";
import { confirmSell, sell100Light, sell25Light, sell50Light, sellCoinGetPercentage, sellCoinStart } from "./handlers/sellConv";
import { decrypt } from '../utils/encryption'
import { retrievePortfolioBalances } from '../external/solanaTrackerClient'
import { showPortfolio } from './handlers/portfolio';
import { UserRefactorRepository } from "../db/repository/UserRefactorRepositery";
import { Steps } from './handlers/steps';
import {
  showNewBuySettings,
  setBuySizeNew,
  setBuySizeAmount,
  setSlippageNew,
  setSlippagePerc,
  setPriorityFeeNew,
  setPriorityFeeAmount,
} from './handlers/buySettings';

import {
  showNewSellSettings,
  setPerc1,
  setPerc2,
  setPerc3,
  askPerc1,
  askPerc2,
  askPerc3,
  setThreshold1,
  setThreshold2,
  setThreshold3,
  askThreshold1,
  askThreshold2,
  askThreshold3,
} from './handlers/sellSettings';

import { session } from 'telegraf';
import logger from '../utils/logger';
import { BotContext, SessionData } from '../types/context';

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_TOKEN is not defined');
}
const bot = new Telegraf<BotContext>(TELEGRAM_TOKEN);

bot.use(session());

const DEFAULT_SESSION: SessionData = {
  step: 0,
  menu: '',
  page: 1,
};

bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = { ...DEFAULT_SESSION };
  }
  return next();
});

export function setupSellCoinHandlers(bot: Telegraf<BotContext>): void {
  bot.action(/sell_coin:.+/, async (ctx) => {
    logger.info("Entering sell_coin handler");
    ctx.session.menu = 'SellCoin';
    const nextStep = await sellCoinStart(ctx);
    ctx.session.step = nextStep;
  });

  bot.action("sell_25_light", async (ctx) => {
    ctx.session.menu = 'SellCoin'; 
    const nestStep = await sell25Light(ctx);
    ctx.session.step = nestStep;
  });

  bot.action("sell_50_light", async (ctx) => {
    ctx.session.menu = 'SellCoin';
    const nestStep = await sell50Light(ctx);
    ctx.session.step = nestStep;
  });

  bot.action("sell_100_light", async (ctx) => {
    ctx.session.menu = 'SellCoin';
    const nestStep = await sell100Light(ctx);
    ctx.session.step = nestStep;
  });

  bot.action('confirm_sell', async (ctx) => {
    ctx.session.menu = 'SellCoin';
    const nextStep = await confirmSell(ctx);
    ctx.session.step = nextStep;
  });

  bot.action("cancel_sell", async (ctx) => {
    ctx.session.menu = '';
    await backToMainMenu(ctx);
    ctx.session.step = 0;
  
  });
}


export function setupPortfolio(bot: Telegraf<BotContext>): void {

  bot.action('show_ciccio', async (ctx) => {
    logger.info("Entering show_ciccio");
    const userId = ctx.from?.id;
    const user = await UserRefactorRepository.getUserByTelegramId(userId); 
  
    if (!user || !user.private_key) {
      await ctx.reply("Please use /start to register first.");
      return;
    }
  
    const page = ctx.session.page || 1;
    const privateKey = decrypt(user.private_key);
    const portfolio = await retrievePortfolioBalances(privateKey);
  
    await showPortfolio(ctx, portfolio, page, false);
  });

  bot.action('show_next', async (ctx) => {
    const userId = ctx.from?.id;
    const user = await UserRefactorRepository.getUserByTelegramId(userId);
    const page = ctx.session.page || 0;
    logger.info({ data: page }, "Current Page:");
    const newPage = page + 1 ;

    if (!user || !user.private_key) {
      await ctx.reply("Please use /start to register first.");
      return;
    }
  
    const privateKey = decrypt(user.private_key);
    const portfolio = await retrievePortfolioBalances(privateKey);
  
    await showPortfolio(ctx, portfolio, newPage, false);
  });

  bot.action('show_previous', async (ctx) => {
    const userId = ctx.from?.id;
    const user = await UserRefactorRepository.getUserByTelegramId(userId);
    const page = ctx.session.page || 2;
    logger.info({ data: page }, "Current Page:");
    const newPage = page - 1 ;

    if (!user || !user.private_key) {
      await ctx.reply("Please use /start to register first.");
      return;
    }

    const privateKey = decrypt(user.private_key);
    const portfolio = await retrievePortfolioBalances(privateKey);
  
    await showPortfolio(ctx, portfolio, newPage, false);
  });

}

export function setupBuyConvHandlers(bot: Telegraf<BotContext>): void {

  bot.action('buy_coin', async (ctx) => {
    ctx.session.menu = 'BuyCoin';
    const nextStep = await buyCoinStart(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('buy_025_light', async (ctx) => {
    ctx.session.menu = 'BuyCoin'; 
    const nextStep = await buy025Light(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('buy_05_light', async (ctx) => {
    ctx.session.menu = 'BuyCoin';
    const nextStep = await buy05Light(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('buy_1_light', async (ctx) => {
    ctx.session.menu = 'BuyCoin';
    const nextStep = await buy1Light(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('confirm_buy', async (ctx) => {
    ctx.session.menu = 'BuyCoin';
    const nextStep = await confirmBuy(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('cancel_buy', async (ctx) => {
    ctx.session.menu = '';
    await backToMainMenu(ctx);
    ctx.session.step = 0;
  });

}

export function setupSellSettingsHandlers(bot: Telegraf<BotContext>): void {

  bot.action('show_new_sell_settings', async (ctx) => {
    ctx.session.menu = 'SellConfigSettings';
    const nextStep = await showNewSellSettings(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_perc_1', async (ctx) => {
    const nextStep = await askPerc1(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_perc_2', async (ctx) => {
    const nextStep = await askPerc2(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_perc_3', async (ctx) => {
    const nextStep = await askPerc3(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_threshold_1', async (ctx) => {
    const nextStep = await askThreshold1(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_threshold_2', async (ctx) => {
    const nextStep = await askThreshold2(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('ask_threshold_3', async (ctx) => {
    const nextStep = await askThreshold3(ctx);
    ctx.session.step = nextStep;
  });


}

export function setupBuySettingsHandlers(bot: Telegraf<BotContext>): void {
  bot.action('show_new_buy_settings', async (ctx) => {
    ctx.session.menu = 'BuyConfigSettings';
    const nextStep = await showNewBuySettings(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('set_buysize_new', async (ctx) => {
    const nextStep = await setBuySizeNew(ctx);
    ctx.session.step = nextStep;
  });

  bot.on('text', async (ctx) => {
    const currentStep = ctx.session.step;

    logger.info({ currentStep, menu: ctx.session.menu }, "BUY Entering text handler");

    if (ctx.session.menu == 'BuyConfigSettings') {
      if (currentStep == Steps.BuyConfigSettings.SET_BUYSIZE) {
        const nextStep = await setBuySizeAmount(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.BuyConfigSettings.SET_SLIPPAGE) {
        const nextStep = await setSlippagePerc(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.BuyConfigSettings.SET_PRIORITY_FEE) {
        const nextStep = await setPriorityFeeAmount(ctx);
        ctx.session.step = nextStep;
      } else {
        logger.info("BUY Nothing really")
      }
      
    }

    if (ctx.session.menu == 'SellConfigSettings') {
      if (currentStep == Steps.SellConfigSettings.SET_PERC_1) {
        const nextStep = await setPerc1(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.SellConfigSettings.SET_PERC_2) {
        const nextStep = await setPerc2(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.SellConfigSettings.SET_PERC_3) {
        const nextStep = await setPerc3(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.SellConfigSettings.SET_THRES_1) {
        const nextStep = await setThreshold1(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.SellConfigSettings.SET_THRES_2) {
        const nextStep = await setThreshold2(ctx);
        ctx.session.step = nextStep;
      } else if (currentStep == Steps.SellConfigSettings.SET_THRES_3) {
        const nextStep = await setThreshold3(ctx);
        ctx.session.step = nextStep;
      } else {
        logger.info("SELL Nothing really")
      }
    }

    if(ctx.session.menu == 'BuyCoin') {
      if(currentStep == Steps.BuyConv.CA) {
        const nextStep = await buyCoinGetCA(ctx);
        ctx.session.step = nextStep;
      } else if( currentStep == Steps.BuyConv.AMOUNT) {
        const nextStep = await buyCoinGetAmount(ctx);
        ctx.session.step = nextStep;
      } else {
        logger.info("BUYCOIN Nothing really")
      }
    }

    if(ctx.session.menu == 'SellCoin') {
      if(currentStep == Steps.SellConv.PERCENTAGE) {
        const nextStep = await sellCoinGetPercentage(ctx);
        ctx.session.step = nextStep;
      } else {
        logger.info("SELLCOIN Nothing really")
      }
    }

  });

  bot.action('set_slippage_new', async (ctx) => {
    const nextStep = await setSlippageNew(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('set_priority_fee_new', async (ctx) => {
    const nextStep = await setPriorityFeeNew(ctx);
    ctx.session.step = nextStep;
  });

  bot.action('back_buy_settings', async (ctx) => {
    const nextStep = await showNewBuySettings(ctx);
    ctx.state.step = nextStep;
  });

  bot.action('back', async (ctx) => {
    ctx.state.menu = null; 
    ctx.state.step = Steps.BuyConfigSettings.MAIN_MENU_BUY;
    await backToMainMenu(ctx);
  });
}

bot.start(async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const username = ctx.from?.username;

  if (!chatId || !userId || !username) {
    return ctx.reply("Unable to identify user. Please try again.");
  }

  return await mainMenu(ctx);
});


setupBuySettingsHandlers(bot);
setupSellSettingsHandlers(bot);
setupBuyConvHandlers(bot);
setupPortfolio(bot);
setupSellCoinHandlers(bot);

bot.catch((err, ctx) => {
  logger.error({ data: err }, `Error for ${ctx.updateType}:`);
  ctx.reply("An unexpected error occurred. Please try again.");
});

export const startBot = () => {
  bot.launch()
    .then(() => {
      logger.info('Bot is running...');
    })
    .catch((err) => {
      logger.error({ data: err }, 'Error starting the bot:');
    });
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
