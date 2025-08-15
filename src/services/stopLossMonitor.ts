import { BuyOrderRepository } from '../db/repository/BuyOrderRepository';
import { fetchMultipleTokenPrices } from '../external/dexscreenerClient';
import { sellTokenByAmount } from '../external/jupiterClient';
import { decrypt } from '../utils/encryption';
import { TELEGRAM_TOKEN } from '../config';
import { escapeMarkdownV2 } from '../utils/formatting';
import axios from 'axios';
import { BuyOrder } from '../db/models/BuyOrder';

import logger from '../utils/logger';
const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const MONITOR_INTERVAL_MS = 60000;

let isRunning = false;
let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Sends a Telegram message to the specified user.
 */
async function sendTelegramMessage(chatId: number, message: string): Promise<void> {
  try {
    const escapedMessage = escapeMarkdownV2(message);
    await axios.post(`${TELEGRAM_API_BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: escapedMessage,
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    logger.error({ data: error }, `Failed to send Telegram message to ${chatId}:`);
  }
}

/**
 * Checks if an order's price threshold has been reached.
 * @param sl_perc - Negative = Stop Loss, Positive = Take Profit
 * @param percentageChange - Calculated as (buy_price - current_price) / buy_price * 100
 */
function shouldTriggerOrder(sl_perc: number, percentageChange: number): boolean {
  if (sl_perc < 0 && percentageChange >= Math.abs(sl_perc)) {
    return true;
  }

  if (sl_perc > 0 && Math.abs(percentageChange) >= sl_perc && percentageChange < 0) {
    return true;
  }

  return false;
}

/**
 * Executes a sell order for a triggered stop loss or take profit threshold.
 */
async function executeSellOrder(order: BuyOrder, currentPrice: number): Promise<void> {
  try {
    const privateKey = decrypt(order.private_key);
    const tokenAddress = order.ca;
    const coinName = order.coin_name;

    const amountToSell = Math.floor((order.quantity * order.perc_to_sell) / 100);

    if (amountToSell <= 0) {
      logger.warn({ orderId: order.id }, `Order ${order.id}: Amount to sell is 0, closing order`);
      await BuyOrderRepository.closeOrder(order.id!);
      return;
    }

    const percentageChange = ((order.buy_price_usd - currentPrice) / order.buy_price_usd) * 100;
    const isStopLoss = order.sl_perc < 0;
    const triggerType = isStopLoss ? 'Stop Loss' : 'Take Profit';

    logger.info(
      `${triggerType} triggered - Order ${order.id} (${order.telegram_username}): ` +
      `${coinName} @ $${order.buy_price_usd} → $${currentPrice} (${percentageChange.toFixed(2)}%)`
    );

    const buyPriceNum = typeof order.buy_price_usd === 'string' ? parseFloat(order.buy_price_usd) : order.buy_price_usd;
    const notificationMessage =
      `*🛑 ${triggerType} ACTIVATED*\n\n` +
      `*${coinName}*\n` +
      `\`${tokenAddress}\`\n\n` +
      `*Buy Price:* $${buyPriceNum.toFixed(8)}\n` +
      `*Current Price:* $${currentPrice.toFixed(8)}\n` +
      `*Change:* ${Math.abs(percentageChange).toFixed(2)}%\n` +
      `*Selling:* ${order.perc_to_sell}% of position\n\n` +
      `_Executing sell order..._`;

    await sendTelegramMessage(order.telegram_id, notificationMessage);

    const { txId } = await sellTokenByAmount(
      tokenAddress,
      amountToSell,
      privateKey,
      order.slippage,
      order.telegram_username,
      6,
      order.priority_fee
    );

    await BuyOrderRepository.closeOrder(order.id!);

    const successMessage =
      `*✅ ${triggerType} EXECUTED*\n\n` +
      `*${coinName}*\n` +
      `*Sold:* ${order.perc_to_sell}% of position\n\n` +
      `_[View Transaction](https://solscan.io/tx/${txId})_`;

    await sendTelegramMessage(order.telegram_id, successMessage);

    logger.info({ orderId: order.id }, `Order ${order.id} executed successfully. TX: ${txId}`);
  } catch (error) {
    logger.error({ data: error }, `Failed to execute sell for order ${order.id}:`);

    const errorMessage =
      `*❌ ${order.sl_perc < 0 ? 'Stop Loss' : 'Take Profit'} FAILED*\n\n` +
      `*${order.coin_name}*\n` +
      `Automatic sell failed. Please sell manually.\n\n` +
      `*Error:* ${String(error).substring(0, 100)}`;

    await sendTelegramMessage(order.telegram_id, errorMessage);

    await BuyOrderRepository.closeOrder(order.id!);
  }
}

/**
 * Monitors all open stop loss and take profit orders, executing sells when thresholds are met.
 */
async function monitorOrders(): Promise<void> {
  try {
    const startTime = Date.now();
    logger.info('Starting SL/TP monitor check');

    const openOrders = await BuyOrderRepository.getOpenBuyOrders();

    if (openOrders.length === 0) {
      return;
    }

    logger.info({ count: openOrders.length }, `Monitoring ${openOrders.length} open order(s)`);

    const uniqueTokens = [...new Set(openOrders.map(order => order.ca))];

    const batches: string[][] = [];
    for (let i = 0; i < uniqueTokens.length; i += 30) {
      batches.push(uniqueTokens.slice(i, i + 30));
    }

    const allPrices: Record<string, number> = {};
    for (const batch of batches) {
      const prices = await fetchMultipleTokenPrices(batch);
      Object.assign(allPrices, prices);
    }

    for (const order of openOrders) {
      const currentPrice = allPrices[order.ca];

      if (!currentPrice || currentPrice <= 0) {
        logger.warn({ coinName: order.coin_name }, `No price found for ${order.coin_name}, skipping order ${order.id}`);
        continue;
      }

      const buyPrice = typeof order.buy_price_usd === 'string' ? parseFloat(order.buy_price_usd) : order.buy_price_usd;
      const percentageChange = ((buyPrice - currentPrice) / buyPrice) * 100;

      if (shouldTriggerOrder(order.sl_perc, percentageChange)) {
        await executeSellOrder(order, currentPrice);
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info({ elapsed: elapsed }, `SL/TP monitor check completed in ${elapsed}ms`);
  } catch (error) {
    logger.error({ data: error }, 'Error in monitorOrders:');
  }
}

/**
 * Starts the Stop Loss / Take Profit monitoring service.
 */
export function startStopLossMonitor(): void {
  if (isRunning) {
    logger.warn('SL/TP monitor already running');
    return;
  }

  logger.info({ MONITOR_INTERVAL_MS: MONITOR_INTERVAL_MS }, `Starting SL/TP monitor (interval: ${MONITOR_INTERVAL_MS}ms)`);
  isRunning = true;

  monitorOrders();

  monitorInterval = setInterval(() => {
    monitorOrders();
  }, MONITOR_INTERVAL_MS);
}

/**
 * Stops the Stop Loss / Take Profit monitoring service.
 */
export function stopStopLossMonitor(): void {
  if (!isRunning) {
    logger.warn('SL/TP monitor not running');
    return;
  }

  logger.info('Stopping SL/TP monitor');
  isRunning = false;

  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
