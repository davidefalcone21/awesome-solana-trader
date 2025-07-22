import { Context } from "telegraf";
import { Markup } from "telegraf";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "node-telegram-bot-api";
import { escapeMarkdownV2, escapeMarkdownV2Links } from "../../utils/formatting";
import { PositionRepository } from "../../db/repository/PositionRepository";
import { Position } from "../../db/models/Position";

import logger from '../../utils/logger';
interface Coin {
  address: string,
  symbol: string | null,
  uiAmount: number,
  priceUsd: number,
  valueUsd: number,
}

export async function showPortfolio(
  ctx: any,
  portfolio: any,
  page: number,
  firstMessage = false
): Promise<void> {
  ctx.session.page = page;
  const coinsPerPage = 6;
  const start = (page - 1) * coinsPerPage;
  const end = start + coinsPerPage;
  const totalPages = Math.ceil(portfolio.items.length / coinsPerPage);

  // Debug logging for portfolio object
  logger.info('=== PORTFOLIO DEBUG ===');
  logger.info({ data: portfolio.wallet }, 'Portfolio wallet:');
  logger.info({ data: portfolio.items?.length }, 'Total items:');
  logger.info({ data: portfolio.totalUsd }, 'Total USD:');
  logger.info({ data: portfolio.totalSolBalanceUsd }, 'Total SOL Balance USD:');
  logger.info({ data: portfolio.totalSolBalanceToken }, 'Total SOL Balance Token:');
  logger.info({ data: portfolio.totalPositionBalanceUsd }, 'Total Position Balance USD:');
  logger.info({ items: portfolio.items?.slice(0, 2) }, 'First 2 items:');

  // WARN: portfolio.priceSol doesn't exist, but it can derived!
  // Handle edge case when wallet has 0 SOL - get SOL price from items instead
  let priceSol: number;
  // Native SOL address (43 characters, not 44!)
  const solItem = portfolio.items.find((item: any) => item.address === 'So11111111111111111111111111111111111111111');

  if (portfolio.totalSolBalanceToken > 0) {
    priceSol = portfolio.totalSolBalanceUsd / portfolio.totalSolBalanceToken;
  } else if (solItem && solItem.priceUsd > 0) {
    // Wallet has 0 SOL balance, but we have the SOL price from the items
    priceSol = solItem.priceUsd;
  } else {
    // Fallback: use a default SOL price to avoid NaN
    priceSol = 150;
    logger.warn({ data: priceSol }, 'Using fallback SOL price:');
  }

  const totalSol = priceSol > 0 ? portfolio.totalUsd / priceSol : 0;
  const totalPositionsSol = priceSol > 0 ? portfolio.totalPositionBalanceUsd / priceSol : 0;

  logger.info({ data: priceSol }, 'Calculated priceSol:');
  logger.info({ data: totalSol }, 'Calculated totalSol:');
  logger.info({ data: totalPositionsSol }, 'Calculated totalPositionsSol:');
  logger.info('======================');

  let message = `📊 *Portfolio Positions* 📊\n`;
  message += `Wallet: \`${portfolio.wallet}\`\n`;
  message += `🔢 *Number of tokens*: ${portfolio.items.length}\n\n`;
  message += `💰 *Total: $${portfolio.totalUsd.toFixed(2)} - \\(${totalSol.toFixed(
    3
  )} SOL\\)*\n`;
  message += `├─ Balance SOL: *$${portfolio.totalSolBalanceUsd.toFixed(
    2
  )} - \\(${portfolio.totalSolBalanceToken.toFixed(3)} SOL\\)*\n`;
  message += `└─ Positions: *$${portfolio.totalPositionBalanceUsd.toFixed(
    2
  )} - \\(${totalPositionsSol.toFixed(3)} SOL\\)*\n\n`;

  // const keyboard: InlineKeyboardButton[][] = [];
  const keyboard: any[][] = [];
  const positionsByCA = (await PositionRepository.getUserPositions(ctx.from?.id)).reduce((acc, item: Position) => {
    acc[item.coin_address] = item;
    return acc;
  }, {} as Record<string, {average_buy_in: number, average_buy_in_sol: number}>);
  const solCoin = getSOL(portfolio.items as Coin[])

  logger.info({ data: solCoin }, 'SOL Coin found:');
  logger.info({ data: solCoin?.priceUsd }, 'SOL Coin price USD:');

  portfolio.items.slice(start, end).forEach((coin: Coin, index: number) => {

    const coinId = `${start + index}`; // Generate a unique identifier for each coin

    // Debug log for each coin
    logger.info({ index: index }, `--- Coin ${index}: ${coin.symbol} ---`);
    logger.info({ data: coin.address }, 'Address:');
    logger.info({ data: coin.symbol }, 'Symbol:');
    logger.info({ data: coin.uiAmount }, 'uiAmount:');
    logger.info({ data: coin.priceUsd }, 'priceUsd:');
    logger.info({ data: coin.valueUsd }, 'valueUsd:');

    const ticker = coin.symbol
    ? `$${coin.symbol}`
    : "$MISSING";

    // Save coin-specific information for later use
    ctx.session[`coin_${coinId}`] = {
      sell_coin_symbol: ticker,
      sell_coin_address: coin.address,
      sell_coin_balance: coin.uiAmount,
      sell_coin_price: coin.priceUsd,
    };

    // logger.info(ctx.session[`coin_${coinId}`]); // Retrieve coin data
    const avgBuyIn = (positionsByCA[coin.address] || {average_buy_in: undefined}).average_buy_in

    logger.info({ data: avgBuyIn }, 'avgBuyIn:');

    const pnlUsd = pnlAddendum(avgBuyIn, coin.priceUsd, coin.address, ctx.from?.id);

    message += `*${ticker}* - [📈](https://dexscreener.com/solana/${coin.address}) - *$${coin.valueUsd.toFixed(
      2
    )}*\n`;
    message += `\`${coin.address}\`\n`;
    message += `*Price USD:* \`$${coin.priceUsd.toFixed(8)}\`${pnlUsd}\n`;
    message += `*Balance:* \`${coin.uiAmount.toFixed(2)}\`\n\n`;

      // Add button to the keyboard, arranged in 2 rows of 3 buttons
    const rowIndex = Math.floor(index / 3); // Calculate row index
    if (!keyboard[rowIndex]) {
      keyboard[rowIndex] = []; // Initialize row if it doesn't exist
    }
    keyboard[rowIndex].push(
      Markup.button.callback(ticker, `sell_coin:${coinId}`)
    );

  });

  // Pagination
  const paginationButtons: InlineKeyboardButton[] = [];
  if (page > 1) {
    paginationButtons.push(
      //Markup.button.callback("← Previous", `show_positions_page_${page - 1}`)
      Markup.button.callback("← Previous", `show_previous`)
    );
  }
  if (page < totalPages) {
    paginationButtons.push(
      //Markup.button.callback("Next →", `show_positions_page_${page + 1}`)
      Markup.button.callback("Next →", `show_next`)
    );
  }

  if (paginationButtons.length) {
    keyboard.push(paginationButtons);
  }

  const replyMarkup = Markup.inlineKeyboard(keyboard);
  // const markdownText = message.replace(/[-._]/g, "\\$&");
  const escapedMessage = escapeMarkdownV2Links(message);
  if (firstMessage) {
    await ctx.replyWithMarkdownV2(escapedMessage,  replyMarkup);
  } else {
    await ctx.editMessageText(escapedMessage, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
    // await ctx.editMessageText(markdownText, replyMarkup);
  }
}

function getSOL(items: Coin[]): Coin | null {
  // Native SOL address (43 characters)
  return items.find((coin) => coin.address === 'So11111111111111111111111111111111111111111') || null
}

function pnlAddendum(avgBuyIn: number | undefined, currentPrice: number, ca: string, id: any): string {
  if (avgBuyIn === undefined) {
    logger.warn({ ca: ca }, `Unable to find position for CA ${ca} and user ${id}. No PNL.`)
    return "";
  }
  if (avgBuyIn === 0) {
    logger.info({ ca: ca }, `Avg buy in is 0 SOL for ${ca} and user ${id}.`)
    return ""
  }
  const pnl = (avgBuyIn - currentPrice) / avgBuyIn * 100;
  if (pnl >= 0) {
    return ` \\(+${pnl.toFixed(2)}% 🟩\\)`
  } else {
    return ` \\(${pnl.toFixed(2)}% 🟥\\)`
  }
}