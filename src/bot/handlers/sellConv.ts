import { Telegraf, Context, Markup } from 'telegraf';
import { formatMarketCap, formatTicker, divisionByDecimal, fromDbToPercSlip, escapeMarkdownV2, fromSolToDb } from "../../utils/formatting";
import { fetchTokenData } from "../../external/dexscreenerClient";
import { fetchTokenInfo } from "../../external/dexscreenerClient";
import { fetchTokenDecimals } from "../../external/solanaTrackerClient";
import { UserRefactorRepository } from "../../db/repository/UserRefactorRepositery";
import { decrypt } from "../../utils/encryption";
import { asyncCheckConfirmationSell } from "../../external/checkConfirmation";
import { sellTokenByAmount, SwapResponse } from "../../external/jupiterClient";
import { transactionSenderAndConfirmationWaiter } from "../../external/transactionSender";
import { Steps } from "./steps";
import logger from '../../utils/logger';
interface CoinData {
    sell_coin_address: string;
    sell_coin_symbol: string;
    sell_coin_balance: number;
    sell_coin_price: number;
}
export async function sellCoinStart(ctx: any): Promise<number> {
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) {
        await ctx.reply("Invalid request.");
        return Steps.SellConv.MAIN_MENU;
    }
    const coinId = callbackData.split(":")[1];
    // const coinData: CoinData = ctx.session.userData[`coin_${coinId}`];
    const coinData: CoinData = ctx.session[`coin_${coinId}`];
    if (!coinData) {
        await ctx.reply("Failed to retrieve coin data.");
        return Steps.SellConv.MAIN_MENU;
    }
    const ca = coinData.sell_coin_address;
    const {
        priceUsd,
        liquidityUsd,
        fdv,
        volume_5m,
        volume_1h,
        volume_6h,
        volume_24h,
        ticker,
        success
    } = await fetchTokenData(ca);
    const tickerFormat = formatTicker(ticker);
    const formatMCap = formatMarketCap(fdv);
    const formatLiquidity = formatMarketCap(liquidityUsd);
    const formattedPrice = priceUsd
    ctx.session.sell_coin_data = coinData;
    ctx.session.sell_coin_address = coinData.sell_coin_address;
    ctx.session.sell_coin_symbol = coinData.sell_coin_symbol;
    ctx.session.sell_coin_balance = coinData.sell_coin_balance;
    ctx.session.sell_coin_price = coinData.sell_coin_price;
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback("⚡ 25%", "sell_25_light"),
            Markup.button.callback("⚡ 50%", "sell_50_light"),
            Markup.button.callback("⚡ 100%", "sell_100_light"),
        ],
        [
            Markup.button.callback("Cancel", "cancel_sell"),
        ],
    ]);
    const message = `*Sell ${tickerFormat}*\n` +
        `\`${ca}\`\n\n` +
        `Current Market Cap: *${formatMCap}*\n` +
        `Current Price: *$${formattedPrice}*\n` +
        `Liquidity: *${formatLiquidity}*\n\n` +
        `Please *TYPE* or *SELECT* the percentage of *${tickerFormat}* to sell.`;
    const escapedMarkdownText = escapeMarkdownV2(message);
    await ctx.replyWithMarkdownV2(escapedMarkdownText, keyboard);
    return Steps.SellConv.PERCENTAGE
}
export async function sell25Light(ctx: any): Promise<number> {
    ctx.session.sell_percentage = 25;
    const coinSymbol = ctx.session.sell_coin_symbol;
    const coinBalance = ctx.session.sell_coin_balance;
    const tickerFormat = formatTicker(coinSymbol);
    const amountToSell = Math.trunc(coinBalance * 0.25); // Truncate to the nearest integer
    ctx.session.sell_amount = amountToSell;
    // Format the waiting message
    const escapedTicker = escapeMarkdownV2(tickerFormat);
    const waitingMessage = `_Transaction Initiated! - Sell *${amountToSell} ${escapedTicker}*_\n_🔄  Fetching quote..._`;
    const escapedMessage = escapeMarkdownV2(waitingMessage);
    await ctx.replyWithMarkdownV2(escapedMessage);
    return await confirmSell(ctx);
}
export async function sell50Light(ctx: any): Promise<number> {
    ctx.session.sell_percentage = 50;
    const coinSymbol = ctx.session.sell_coin_symbol;
    const coinBalance = ctx.session.sell_coin_balance;
    const tickerFormat = formatTicker(coinSymbol);
    const amountToSell = Math.trunc(coinBalance * 0.5); // Truncate to the nearest integer
    ctx.session.sell_amount = amountToSell;
    // Format the waiting message
    const escapedTicker = escapeMarkdownV2(tickerFormat);
    const waitingMessage = `_Transaction Initiated! - Sell *${amountToSell} ${escapedTicker}*_\n_🔄  Fetching quote..._`;
    const escapedMessage = escapeMarkdownV2(waitingMessage);
    await ctx.replyWithMarkdownV2(escapedMessage);
    return await confirmSell(ctx);
}
export async function sell100Light(ctx: any): Promise<number> {
    ctx.session.sell_percentage = 100;
    const coinSymbol = ctx.session.sell_coin_symbol;
    const coinBalance = ctx.session.sell_coin_balance;
    const tickerFormat = formatTicker(coinSymbol);
    const amountToSell = Math.trunc(coinBalance); // Truncate to the nearest integer
    ctx.session.sell_amount = amountToSell;
    // Format the waiting message
    const escapedTicker = escapeMarkdownV2(tickerFormat);
    const waitingMessage = `_Transaction Initiated! - Sell *${amountToSell} ${escapedTicker}*_\n_🔄  Fetching quote..._`;
    const escapedMessage = escapeMarkdownV2(waitingMessage);
    await ctx.replyWithMarkdownV2(escapedMessage);
    return await confirmSell(ctx);
  }
  export async function sellCoinGetPercentage(ctx: any): Promise<number> {
    try {
      const percentage = parseFloat(ctx.message?.text || "0");
      if (percentage <= 0 || percentage > 100) {
        throw new Error("Percentage must be between 0 and 100");
      }
      ctx.session.sell_percentage = percentage;
      const coinSymbol = ctx.session.sell_coin_symbol;
      const coinBalance = ctx.session.sell_coin_balance;
      // Calculate the amount to sell
      const amountToSell = Math.trunc(coinBalance * (percentage / 100)); // Truncate to the nearest integer
      ctx.session.sell_amount = amountToSell;
      const summary = `📄 *Transaction Summary* 📄\n\n` +
        `*Token Symbol*: ${coinSymbol}\n` +
        `*Nr of Tokens to Sell*: ${amountToSell}\n` +
        `*Percentage*: ${percentage}%\n` +
        `*Token Address*: ${ctx.session.sell_coin_address}\n\n` +
        `Please confirm the transaction.`;
      const escapedSummary = escapeMarkdownV2(summary);
      await ctx.replyWithMarkdownV2(escapedSummary, Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", "confirm_sell")],
        [Markup.button.callback("Cancel", "cancel_sell")],
      ]));
      return Steps.SellConv.CONFIRM;
    } catch (error) {
      await ctx.reply(
        `❌ Invalid percentage ${(error as Error).message} Please enter a valid percentage 0 100`,
        Markup.inlineKeyboard([[Markup.button.callback("Cancel", "cancel_sell")]])
      );
      return Steps.SellConv.PERCENTAGE;
    }
  }
export async function confirmSell(ctx: any): Promise<number> {
    try {
        const userId = ctx.from?.id;
        if (!userId) {
            await ctx.reply("User not found");
            return Steps.SellConv.MAIN_MENU;
        }
        // Replace this with your database logic to fetch user details
        const user = await UserRefactorRepository.getUserByTelegramId(userId);
        if (!user || !user.private_key) {
            await ctx.reply("Please use /start to register first.");
            return Steps.SellConv.MAIN_MENU;
        }
        const privateKey = decrypt(user.private_key);
        const ca = ctx.session.sell_coin_address; 
        const amount = ctx.session.sell_amount;
        const amountStr = amount.toFixed(10).replace(/\.?0+$/, ""); // Format the amount
        const slippage = user.slippage;
        const buySize = user.buy_size;
        const telegramUsername = user.telegram_username;
        const priorityFee = user.priority_fee;
        // Fetch token decimals and info
        const decimals = await fetchTokenDecimals(ca);
        const tokenInfo = await fetchTokenInfo(ca);
        let ticker = "MISSING";
        let tokenNameFormat = "MISSING";
        let priceBuyUsd = 0.0;
        if (tokenInfo) {
            ticker = tokenInfo.symbol;
            priceBuyUsd = parseFloat(tokenInfo.price);
            tokenNameFormat = `$${ticker}`;
        }
        // Sell token and get transaction details
        const response: SwapResponse = await sellTokenByAmount(
            ca,
            amount,
            privateKey,
            slippage,
            telegramUsername || '',
            decimals,
            priorityFee
        );
        const txId = response.txId;
        const quote = response.quote;
        if (!quote) {
            throw new Error('Quote not available');
        }
        // Parse quote details
        const inputMint = quote.inputMint || "";
        const inAmount = parseFloat(quote.inAmount || "0");
        const outputMint = quote.outputMint || "";
        const outAmount = parseFloat(quote.outAmount || "0");
        const priceImpactPct = quote.priceImpactPct || "";
        const amountSolFormat = (outAmount / 1_000_000_000).toFixed(9).replace(/\.?0+$/, "");
        const amountTokenFormat = (inAmount / Math.pow(10, decimals)).toFixed(9).replace(/\.?0+$/, "");
        const messageToSend = `*SELL ${tokenNameFormat}*\n` +
            `\`${inputMint}\`\n\n` +
            `_Fetched quote from Jupiter_\n` +
            `*${amountTokenFormat} ${tokenNameFormat}* \`⇄\` *${amountSolFormat} SOL*\n\n` +
            `🔄 _Transaction sent and it's being confirmed, please wait for result..._\n` +
            `_[Solscan Link](https://solscan.io/tx/${txId})_`;
        // const escapedMarkdownText = escapeMarkdownV2(messageToSend);
        const escapedMarkdownText = messageToSend
            .replace(/-/g, '\\-')
            .replace(/\./g, '\\.')
            .replace(/\+/g, '\\+')
            .replace(/=/g, '\\=')
            .replace(/\|/g, '\\|');
        const message = await ctx.replyWithMarkdownV2(escapedMarkdownText);
        const messageId = message.message_id;
        await transactionSenderAndConfirmationWaiter({
            serializedTransaction: response.serializedTransaction,
            blockhashWithExpiryBlockHeight: {
                blockhash: response.blockhash,
                lastValidBlockHeight: response.lastValidBlockHeight
            }
        });
        // Fire-and-forget confirmation check
        asyncCheckConfirmationSell(
            txId,
            messageId,
            userId,
            tokenNameFormat,
            quote,
            decimals
        );
        return Steps.SellConv.MAIN_MENU;
    } catch (error) {
        logger.error({ data: error }, "Error in confirmSell:");
        await ctx.reply(`❌ Sell failed:\n${error.message}`);
        return Steps.SellConv.MAIN_MENU;
    }
}
