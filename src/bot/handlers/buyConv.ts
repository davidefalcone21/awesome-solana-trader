import { Markup } from 'telegraf';
import { UserRefactorRepository } from "../../db/repository/UserRefactorRepositery";
import { Steps } from "./steps";
import { fetchTokenData } from "../../external/dexscreenerClient";
import { buyToken, SwapResponse, Quote } from "../../external/jupiterClient";
import { fetchTokenInfo } from "../../external/dexscreenerClient";
import { asyncCheckConfirmationBuy } from "../../external/checkConfirmation";
import { transactionSenderAndConfirmationWaiter } from "../../external/transactionSender";
import { formatMarketCap, formatTicker, divisionByDecimal, fromDbToPercSlip, escapeMarkdownV2, fromSolToDb } from "../../utils/formatting";
import { decrypt } from "../../utils/encryption";
import { BotContext } from "../../types/context";
import logger from "../../utils/logger";

function isValidSolAddress(address: string): boolean {
  return address.length === 44 || address.length === 43;
}

export async function buyCoinStart(ctx: BotContext): Promise<number> {
  await ctx.reply(
    "Please enter the Contract Address (CA) of the coin you want to buy.",
    Markup.inlineKeyboard([
      [Markup.button.callback("Cancel", 'cancel_buy')]
    ])
  );

  return Steps.BuyConv.CA;
}

export async function buyCoinGetCA(ctx: BotContext): Promise<number> {
  const userId = ctx.from?.id;
  let ca = '';

  if (!userId) {
    await ctx.reply("Unable to identify user. Please try again.");
    return Steps.BuyConv.MAIN_MENU;
  }

  if (ctx.message && 'text' in ctx.message) {
    ca = ctx.message.text;
  } else if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
    const user = await UserRefactorRepository.getUserByTelegramId(userId);

    if (!user) {
      await ctx.reply("User not found. Returning to the main menu.");
      return Steps.BuyConv.MAIN_MENU;
    }

    ca = ctx.session.ca || '';
  }

  if (!isValidSolAddress(ca)) {
    await ctx.reply(
      "Invalid Contract Address. Please enter a valid Solana Contract Address.",
      Markup.inlineKeyboard([
        [Markup.button.callback("Cancel", 'cancel_buy')]
      ])
    );
    return Steps.BuyConv.CA;
  }

  const {
    priceUsd,
    liquidityUsd,
    fdv,
    ticker,
    success
  } = await fetchTokenData(ca);

  if (!success) {
    await ctx.reply("Failed to fetch token data. Please try again later.");
    return Steps.BuyConv.MAIN_MENU;
  }

  const tickerFormat = formatTicker(ticker);
  const formatMCap = formatMarketCap(fdv);
  const formatLiquidity = formatMarketCap(liquidityUsd);
  const formattedPrice = priceUsd;

  ctx.session = {
    ...ctx.session,
    ca,
    tickerFormat,
    currentPrice: formattedPrice,
    currentMarketCap: String(formatMCap),
    liquidity: String(formatLiquidity)
  };

  const message = `*Buy ${tickerFormat}*\n` +
    `\`${ca}\`\n\n` +
    `Current Market Cap: *${formatMCap}*\n` +
    `Current Price: *$${formattedPrice}*\n` +
    `Liquidity: *${formatLiquidity}*\n\n` +
    `Please *TYPE* or *SELECT* the amount of SOL to buy`;

  const escapedMessage = escapeMarkdownV2(message);

  const keyboard = [
    [
      Markup.button.callback("⚡ 0.25 SOL", 'buy_025_light'),
      Markup.button.callback("⚡ 0.5 SOL", 'buy_05_light'),
      Markup.button.callback("⚡ 1 SOL", 'buy_1_light')
    ],
    [
      Markup.button.callback("Cancel", 'cancel_buy')
    ]
  ];

  if (ctx.callbackQuery) {
    await ctx.editMessageText(escapedMessage, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
  } else {
    await ctx.replyWithMarkdownV2(escapedMessage, Markup.inlineKeyboard(keyboard));
  }

  return Steps.BuyConv.AMOUNT;
}

export async function buyCoinGetAmount(ctx: BotContext): Promise<number> {
  try {
    if (!ctx.message || !('text' in ctx.message)) {
      throw new Error("Invalid message format");
    }

    const amount = fromSolToDb(Number(ctx.message.text));
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    ctx.session.amount = amount;

    const userId = ctx.message.from?.id;
    if (!userId) {
      throw new Error("Unable to identify user");
    }

    const user = await UserRefactorRepository.getUserByTelegramId(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const slippage = fromDbToPercSlip(user.slippage);
    const amountSol = (amount / 1_000_000_000).toFixed(10).replace(/\.?0+$/, '');

    const caContext = ctx.session.ca;
    const tickerFormat = ctx.session.tickerFormat;
    const formattedPrice = ctx.session.currentPrice;
    const formatMcap = ctx.session.currentMarketCap;
    const formatLiquidity = ctx.session.liquidity;

    const summary = `*Buy ${tickerFormat} - SUMMARY *\n` +
      `\`${caContext}\`\n\n` +
      `Current Market Cap: *${formatMcap}*\n` +
      `Current Price: *$${formattedPrice}*\n` +
      `Liquidity: *${formatLiquidity}*\n\n` +
      `Amount: *${amountSol} SOL*\n` +
      `Slippage: *${slippage}%*\n\n` +
      `Please confirm the transaction.`;

    const markdownSummary = escapeMarkdownV2(summary);

    await ctx.replyWithMarkdownV2(
      markdownSummary,
      Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", 'confirm_buy')],
        [Markup.button.callback("Cancel", 'cancel_buy')],
      ])
    );

    return Steps.BuyConv.CONFIRM;
  } catch (error: any) {
    logger.error({ error }, "Error in buyCoinGetAmount");

    await ctx.reply(
      `❌ Amount invalid: ${error.message}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Cancel", 'cancel_buy')],
      ])
    );

    return Steps.BuyConv.AMOUNT;
  }
}

async function buyLight(ctx: BotContext, amountSol: number): Promise<number> {
  const amount = fromSolToDb(amountSol);
  ctx.session.amount = amount;

  const tickerFormat = (ctx.session.tickerFormat || '$MISSING')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|');

  const amountFormat = (amount / 1_000_000_000)
    .toFixed(6)
    .replace(/\.?0+$/, '')
    .replace(/\./g, '\\.');

  const waitingMessage = `_Transaction Initiated\\! \\- *${tickerFormat}* \\- *${amountFormat}* SOL _\n` +
    `_🔄  Fetching quote\\.\\.\\._`;

  await ctx.replyWithMarkdownV2(
    waitingMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback("Cancel", "cancel_buy")]
    ])
  );

  return await confirmBuy(ctx);
}

export async function buy025Light(ctx: BotContext): Promise<number> {
  return await buyLight(ctx, 0.25);
}

export async function buy05Light(ctx: BotContext): Promise<number> {
  return await buyLight(ctx, 0.5);
}

export async function buy1Light(ctx: BotContext): Promise<number> {
  return await buyLight(ctx, 1);
}


export async function confirmBuy(ctx: BotContext): Promise<number> {
  const query = ctx.callbackQuery;
  if (!query) {
    logger.error("No callback query found in confirmBuy");
    return Steps.BuyConv.MAIN_MENU;
  }

  const userId = query.from.id;
  const user = await UserRefactorRepository.getUserByTelegramId(userId);

  if (!user) {
    logger.error("User not found in confirmBuy");
    return Steps.BuyConv.MAIN_MENU;
  }

  const encryptedPrivateKey = user.private_key || '';
  const privateKey = decrypt(encryptedPrivateKey);

  let ca: string;
  let amount: number;

  try {
    ca = ctx.session.ca || '';
    amount = ctx.session.amount || 0;
  } catch (error) {
    const userContext = ctx.session[userId] || {};
    ca = userContext.ca || '';
    amount = userContext.amount || 0;
  }

  if (!ca || !amount) {
    logger.error("Missing CA or amount in confirmBuy");
    return Steps.BuyConv.MAIN_MENU;
  }

  const amountSol = (amount / 1_000_000_000).toFixed(10).replace(/\.0+$/, '');
  const slippage = user.slippage;
  const priorityFee = user.priority_fee;

  try {
    const response: SwapResponse = await buyToken(
      ca,
      privateKey,
      amount,
      slippage,
      user.telegram_username || '',
      priorityFee
    );

    const txId = response.txId;
    const quote = response.quote;

    if (!quote) {
      throw new Error('Quote not available');
    }

    const inputMint = quote.inputMint || '';
    const inAmount = parseFloat(quote.inAmount || '0');
    const outputMint = quote.outputMint || '';
    const outAmount = parseFloat(quote.outAmount || '0');

    const tokenInfo = await fetchTokenInfo(ca);
    let ticker: string;
    let priceBuyUsd: number;
    let decimals: number;
    let tokenNameFormat: string;

    if (tokenInfo) {
      ticker = tokenInfo.symbol;
      priceBuyUsd = parseFloat(tokenInfo.price);
      decimals = tokenInfo.decimals;
      tokenNameFormat = formatTicker(ticker);
    } else {
      priceBuyUsd = 0.0;
      ticker = "MISSING";
      decimals = 6;
      tokenNameFormat = "MISSING";
    }

    const amountSolFormat = inAmount / 1_000_000_000;
    const amountTokenFormat = divisionByDecimal(outAmount, decimals);

    const messageNew = (
      `*BUY ${tokenNameFormat}*\n` +
      `\`${ca}\`\n\n` +
      `_Fetched quote from Jupiter_\n` +
      `*${amountSolFormat} SOL* \`⇄\` *${amountTokenFormat} ${tokenNameFormat}*\n\n` +
      `🔄 _Transaction sent and it's being confirmed, please wait for result..._\n` +
      `_[Solscan Link](https://solscan.io/tx/${txId})_`
    );

    const markdownText = messageNew
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/\+/g, '\\+')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|');

    const message = await ctx.replyWithMarkdownV2(markdownText);
    const messageId = message.message_id;

    await transactionSenderAndConfirmationWaiter({
      serializedTransaction: response.serializedTransaction,
      blockhashWithExpiryBlockHeight: {
        blockhash: response.blockhash,
        lastValidBlockHeight: response.lastValidBlockHeight
      }
    });

    if (query.message?.chat?.id) {
      asyncCheckConfirmationBuy(
        txId,
        messageId,
        query.message.chat.id,
        tokenNameFormat,
        quote,
        decimals,
        tokenInfo
      );
    }

  } catch (error: any) {
    logger.error({ error }, `Error in confirmBuy`);

    const errorMessageDetail = error?.message?.substring(0, 80) || 'Unknown error';
    const messageError = (
      `*Buy failed: ${ca}* \n\n` +
      `*Error in communicating with Jupiter.*\n` +
      `Token may not be tradable yet or the transaction exceeded your settings.\n` +
      `Check your SOL balance and/or your slippage settings.\n\n` +
      `*Error Details:* \`${errorMessageDetail}\``
    )
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/\+/g, '\\+')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/"/g, '\\"');

    await ctx.replyWithMarkdownV2(messageError);
  }

  return Steps.BuyConv.MAIN_MENU;
}