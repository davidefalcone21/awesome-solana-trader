import { Connection, TransactionConfirmationStatus } from '@solana/web3.js';
import axios from 'axios';
import { divisionByDecimal, escapeMarkdownV2 } from '../utils/formatting';
import { TELEGRAM_TOKEN } from '../config';
import { Position } from "../db/models/Position";
import { PositionRepository } from '../db/repository/PositionRepository';
import { BuyOrderRepository } from '../db/repository/BuyOrderRepository';
import { UserRefactorRepository } from '../db/repository/UserRefactorRepositery';
import logger from '../utils/logger';

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const TIMEOUT_SECONDS = 60;
const INTERVAL_SECONDS = 6;

if (!SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL environment variable is required');
}

async function updateTelegramMessage(
  chatId: number,
  messageId: number,
  newText: string
): Promise<void> {
  try {
    const response = await axios.post(`${TELEGRAM_API_BASE_URL}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'MarkdownV2',
    });
    if (response.data.ok) {
      logger.info({ messageId: messageId }, `Telegram message updated successfully: ${messageId}`);
    } else {
      logger.error({ description: response.data.description }, `Failed to update Telegram message: ${response.data.description}`);
    }
  } catch (error) {
    logger.error({ data: error }, 'Error updating Telegram message:');
  }
}
export async function asyncCheckConfirmationBuy(
  txId: string,
  messageId: number,
  chatId: number,
  tokenName: string,
  quote: any,
  decimals: number,
  tokenInfo: any,
): Promise<void> {
  const txLink = `https://solscan.io/tx/${txId}`;
  const inputMint = quote.inputMint || '';
  const inAmount = parseFloat(quote.inAmount || '0');
  const outputMint = quote.outputMint || '';
  const outAmount = parseFloat(quote.outAmount || '0');
  const amountSolFormat = inAmount / 1_000_000_000;
  const amountTokenFormat = divisionByDecimal(outAmount, decimals);
  const { result, message } = await checkConfirmation(txId);
  logger.info({ txId: txId }, `Check Confirmation for ${txId} with result ${result} and message error ${message}`);
  let messageNew: string;
  if (!result) {
    messageNew = `*BUY ${tokenName}*\n` +
      `\`${outputMint}\`\n\n` +
      `_Fetched quote from Jupiter_\n` +
      `*${amountSolFormat} SOL* \`⇄\` *${amountTokenFormat} ${tokenName}*\n\n` +
      `❌ _Transaction FAILED_\n` +
      `*Error*: ${message.replace(/\(/g, ' ').replace(/\)/g, ' ')}\n` +
      `Check your SOL balance and/or your slippage settings\n\n` +
      `_[Solscan Link](${txLink})_`;
  } else {
    messageNew = `*BUY ${tokenName}*\n` +
      `\`${outputMint}\`\n\n` +
      `_Fetched quote from Jupiter_\n` +
      `*${amountSolFormat} SOL* \`⇄\` *${amountTokenFormat} ${tokenName}*\n\n` +
      `✅ _Transaction CONFIRMED_\n\n` +
      `_[Solscan Link](${txLink})_`;
    const position: Position = {
      id: 1,
      telegram_id: chatId,
      coin_symbol: tokenInfo.symbol,
      coin_address: outputMint,
      total_quantity: amountTokenFormat,
      average_buy_in: tokenInfo.price,
      average_buy_in_sol: amountSolFormat / amountTokenFormat,
      last_updated: new Date(), 
    }
    await PositionRepository.upsert(position).catch((err) => {
      logger.error({ data: err }, `Unable to upsert position ${position} after confirmation`)
    });
    try {
      const user = await UserRefactorRepository.getUserByTelegramId(chatId);
      if (user) {
        for (let i = 1; i <= 3; i++) {
          const threshold = user[`threshold_${i}` as keyof typeof user] as number;
          const perc = user[`perc_${i}` as keyof typeof user] as number;
          if (threshold !== 0 && perc !== 0) {
            await BuyOrderRepository.addBuyOrder({
              telegram_id: chatId,
              ca: outputMint,
              coin_name: tokenInfo.symbol,
              buy_price_usd: tokenInfo.price,
              quantity: amountTokenFormat,
              sl_perc: threshold,
              perc_to_sell: perc,
              status: 'open',
              private_key: user.private_key || '',
              slippage: user.slippage,
              telegram_username: user.telegram_username || '',
              priority_fee: user.priority_fee,
            });
            logger.info({ i: i }, `Created buy_order for threshold_${i}: ${threshold}% to sell ${perc}%`);
          }
        }
      }
    } catch (error) {
      logger.error({ data: error }, 'Error creating buy orders for SL/TP monitoring:');
    }
  }
  const messageEscaped = escapeMarkdownV2(messageNew);
  await updateTelegramMessage(chatId, messageId, messageEscaped);
}
export async function asyncCheckConfirmationSell(
  txId: string,
  messageId: number,
  chatId: number,
  tokenName: string,
  quote: any,
  decimals: number
): Promise<void> {
  const txLink = `https://solscan.io/tx/${txId}`;
  const inputMint = quote.inputMint || '';
  const inAmount = parseFloat(quote.inAmount || '0');
  const outputMint = quote.outputMint || '';
  const outAmount = parseFloat(quote.outAmount || '0');
  const amountSolFormat = outAmount / 1_000_000_000;
  const amountTokenFormat = divisionByDecimal(inAmount, decimals);
  const { result, message } = await checkConfirmation(txId);
  logger.info({ txId: txId }, `Check Confirmation for ${txId} with result ${result} and message error ${message}`);
  let messageNew: string;
  if (!result) {
    messageNew = `*SELL ${tokenName}*\n` +
      `\`${inputMint}\`\n\n` +
      `_Fetched quote from Jupiter_\n` +
      `*${amountTokenFormat} ${tokenName}* \`⇄\` *${amountSolFormat} SOL*\n\n` +
      `❌ _Transaction FAILED_\n` +
      `*Error*: ${message.replace(/\(/g, ' ').replace(/\)/g, ' ')}\n` +
      `Check your SOL balance and/or your slippage settings\n\n` +
      `_[Solscan Link](${txLink})_`;
  } else {
    messageNew = `*SELL ${tokenName}*\n` +
      `\`${inputMint}\`\n\n` +
      `_Fetched quote from Jupiter_\n` +
      `*${amountTokenFormat} ${tokenName}* \`⇄\` *${amountSolFormat} SOL*\n\n` +
      `✅ _Transaction CONFIRMED_\n\n` +
      `_[Solscan Link](${txLink})_`;
      await PositionRepository.decreaseQuantity(chatId, inputMint, amountTokenFormat).catch((err) => {
        logger.error({ data: err }, `Unable to decrease ${inputMint} by ${amountTokenFormat} for user ${chatId} after confirmation`)
      });
      try {
        await BuyOrderRepository.closeOrdersByCA(chatId, inputMint);
      } catch (error) {
        logger.error({ data: error }, 'Error closing buy orders after manual sell:');
      }
  }
  const messageEscaped = escapeMarkdownV2(messageNew);
  await updateTelegramMessage(chatId, messageId, messageEscaped);
}
export async function checkConfirmation(txId: string): Promise<{ result: boolean; message: string }> {
  const connection = new Connection(SOLANA_RPC_URL!);
  const timeout = TIMEOUT_SECONDS * 1000; 
  const interval = INTERVAL_SECONDS * 1000;
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      logger.info({ txId: txId }, `Checking confirmiation transaction status for ${txId}`);
      const signatureStatuses = await connection.getSignatureStatuses([txId]);
      const status = signatureStatuses.value[0];
      if (status) {
        logger.info({ data: status }, `Transaction ${txId} status:`);
        if (status.confirmationStatus === 'confirmed') {
          if (!status.err) {
            return { result: true, message: '' };
          } else {
            if (status.err && typeof status.err === 'object' && 'InstructionError' in status.err) {
              const instructionError = status.err.InstructionError;
              const errorCode = (instructionError as [number, { Custom: number }])?.[1]?.Custom;
              if (errorCode === 6001 || errorCode === 6000) {
                logger.info({ errorCode: errorCode }, `Error code is ${errorCode}`);
                return { result: false, message: 'Slippage Tolerance Exceeded' };
              } else {
                return { result: false, message: `Transaction failed with custom error: ${JSON.stringify(instructionError)}` };
              }
            }
            return { result: false, message: `Transaction failed with error: ${JSON.stringify(status.err)}` };
          }
        }
      }
    } catch (error) {
      logger.error({ data: error }, `Error fetching transaction status for ${txId}:`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  logger.error({ txId: txId }, `Transaction ${txId} not confirmed within ${TIMEOUT_SECONDS} seconds`);
  return { result: false, message: `Transaction not confirmed within ${TIMEOUT_SECONDS} seconds` };
}