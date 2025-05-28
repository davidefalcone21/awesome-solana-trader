import { Keypair, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';

import { Connection } from '@solana/web3.js';
import { transactionSenderAndConfirmationWaiter, sendRawTransaction } from './transactionSender';
import { multiplyByDecimal } from '../utils/formatting';

import logger from '../utils/logger';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL!;
const JUPITER_QUOTE_URL = process.env.JUPITER_QUOTE_URL!;
const JUPITER_SWAP_URL = process.env.JUPITER_SWAP_URL!;
const PLATFORM_FEE_WALLET = process.env.PLATFORM_FEE_WALLET!;
const PLATFORM_FEE_BPS = parseInt(process.env.PLATFORM_FEE_BPS || '100', 10);

if (!SOLANA_RPC_URL || !JUPITER_QUOTE_URL || !JUPITER_SWAP_URL || !PLATFORM_FEE_WALLET) {
  throw new Error('Required environment variables: SOLANA_RPC_URL, JUPITER_QUOTE_URL, JUPITER_SWAP_URL, PLATFORM_FEE_WALLET');
}

export interface Quote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface SwapResponse {
  quote: Quote | null;
  txId: string;
  serializedTransaction: Buffer<Uint8Array<ArrayBufferLike>>;
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function buyToken(
  tokenAddress: string,
  privateKeyStr: string,
  buySize: number,
  slippage: number,
  telegramUsername: string,
  priorityFee: number
): Promise<SwapResponse> {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyStr));

    const userPublicKey = keypair.publicKey.toBase58();

    logger.info({ tokenAddress: tokenAddress }, `JUPITER - Buying token ${tokenAddress} with slippage ${slippage} and buy size ${buySize} for ${telegramUsername}`);

    // Step 1: Get Quote
    const quoteParams = {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
      outputMint: tokenAddress,
      amount: buySize,
      slippageBps: slippage,
      userPublicKey: userPublicKey,
      // platformFeeBps: PLATFORM_FEE_BPS,
    };

    const startQuoteTime = Date.now();
    const quoteResponse = await axios.get(JUPITER_QUOTE_URL, { params: quoteParams });
    const endQuoteTime = Date.now();
    const quoteTime = (endQuoteTime - startQuoteTime) / 1000;

    logger.info({ telegramUsername: telegramUsername }, `${telegramUsername} - Jupiter quote time took ${quoteTime} seconds`);

    const quote = quoteResponse.data;
    logger.info({ data: quote }, `${telegramUsername} Quote response:`);

    if (quote.error) {
      const errorMessage = quote.error || 'Unknown error';
      logger.error({ errorMessage: errorMessage }, `Quote error: ${errorMessage}`);
      throw new Error(`Quote error: ${errorMessage}`);
    }

    // Step 2: Execute Swap
    const swapData = {
      quoteResponse: quote,
      userPublicKey: userPublicKey,
      // feeAccount: PLATFORM_FEE_WALLET,
      prioritizationFeeLamports: { jitoTipLamports: Number(priorityFee) },
    };

    const startSwapTime = Date.now();
    const swapResponse = await axios.post(JUPITER_SWAP_URL, swapData, {
      headers: { 'Content-Type': 'application/json' },
    });
    const endSwapTime = Date.now();
    const swapTime = (endSwapTime - startSwapTime) / 1000;

    // logger.info({ telegramUsername: telegramUsername }, `${telegramUsername} Jupiter swap time took ${swapTime} seconds`);

    const swapTx = Buffer.from(swapResponse.data.swapTransaction, 'base64');
    // logger.info({ data: swapResponse.data }, `${telegramUsername} Swap response:`);

    // Step 3: Call transactionSenderAndConfirmationWaiter
    const connection = new Connection(SOLANA_RPC_URL!);
    const transaction = VersionedTransaction.deserialize(swapTx);
    transaction.sign([keypair]);

    const serializedTransaction = Buffer.from(transaction.serialize());
    const blockhash = transaction.message.recentBlockhash;
    const txId = await sendRawTransaction(connection, serializedTransaction);

    logger.info({ data: txId }, `${telegramUsername} Transaction ID:`);

    return {
      quote: quoteResponse.data,
      txId: txId,
      serializedTransaction: serializedTransaction,
      blockhash: blockhash,
      lastValidBlockHeight: swapResponse.data.lastValidBlockHeight,
    }

  } catch (error) {
    logger.error({ data: error }, 'Error in buyToken:');
    throw error;
  }
}

export async function sellTokenByAmount(
  tokenAddress: string,
  amount: number,
  privateKeyStr: string,
  slippage: number,
  telegramUsername: string,
  decimals: number,
  priorityFee: number
): Promise<SwapResponse> {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyStr));

    const userPublicKey = keypair.publicKey.toBase58();

    const tokenAmount = multiplyByDecimal(amount, decimals)

    logger.info({ tokenAmount: tokenAmount }, `JUPITER - Selling ${tokenAmount} token ${tokenAddress} with slippage ${slippage} for ${telegramUsername}`);

    // Step 1: Get Quote
    const quoteParams = {
      inputMint: tokenAddress, 
      outputMint: 'So11111111111111111111111111111111111111112',// SOL mint address
      amount: tokenAmount,
      slippageBps: slippage,
      userPublicKey: userPublicKey,
    };

    const startQuoteTime = Date.now();
    const quoteResponse = await axios.get(JUPITER_QUOTE_URL, { params: quoteParams });
    const endQuoteTime = Date.now();
    const quoteTime = (endQuoteTime - startQuoteTime) / 1000;

    logger.info({ telegramUsername: telegramUsername }, `${telegramUsername} - Jupiter quote time took ${quoteTime} seconds`);

    const quote = quoteResponse.data;
    logger.info({ data: quote }, `${telegramUsername} Quote response:`);

    if (quote.error) {
      const errorMessage = quote.error || 'Unknown error';
      logger.error({ errorMessage: errorMessage }, `Quote error: ${errorMessage}`);
      throw new Error(`Quote error: ${errorMessage}`);
    }

    // Step 2: Execute Swap
    const swapData = {
      quoteResponse: quote,
      userPublicKey: userPublicKey,
      prioritizationFeeLamports: { jitoTipLamports: Number(priorityFee) },
    };

    const startSwapTime = Date.now();
    const swapResponse = await axios.post(JUPITER_SWAP_URL, swapData, {
      headers: { 'Content-Type': 'application/json' },
    });
    const endSwapTime = Date.now();
    const swapTime = (endSwapTime - startSwapTime) / 1000;


    const swapTx = Buffer.from(swapResponse.data.swapTransaction, 'base64');

    // Step 3: Call transactionSenderAndConfirmationWaiter
    const connection = new Connection(SOLANA_RPC_URL!);
    const transaction = VersionedTransaction.deserialize(swapTx);
    transaction.sign([keypair]);

    const serializedTransaction = Buffer.from(transaction.serialize());
    const blockhash = transaction.message.recentBlockhash;
    const txId = await sendRawTransaction(connection, serializedTransaction);

    logger.info({ data: txId }, `${telegramUsername} Transaction ID:`);

    return {
      quote: quoteResponse.data,
      txId: txId,
      serializedTransaction: serializedTransaction,
      blockhash: blockhash,
      lastValidBlockHeight: swapResponse.data.lastValidBlockHeight,
    }

  } catch (error) {
    logger.error({ data: error }, 'Error in sellToken:');
    throw error;
  }
}
