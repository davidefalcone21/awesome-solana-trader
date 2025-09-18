import axios from 'axios';
import { getPublicKeyFromPrivateKey } from '../utils/encryption';

import logger from '../utils/logger';
const API_KEY = process.env.SOLANA_TRACKER_API_KEY;
const BASE_URL = "https://data.solanatracker.io";

if (!API_KEY) {
  throw new Error('SOLANA_TRACKER_API_KEY environment variable is required');
}

export interface TokenInfo {
  symbol: string;
  price: string;
  decimals: number;
}

/**
 * Fetch token information from Solana Tracker
 * Returns token symbol, price, and decimals
 */
export async function fetchTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  const apiUrl = `${BASE_URL}/tokens/${tokenAddress}`;
  const headers = {
    'x-api-key': API_KEY,
    'accept': 'application/json',
  };

  try {
    const response = await axios.get(apiUrl, { headers });

    if (response.status === 200 && response.data) {
      const data = response.data;

      const symbol = data.token?.symbol || 'MISSING';
      const decimals = data.token?.decimals ?? 6;

      let price = '0.0';
      if (data.pools && data.pools.length > 0) {
        const poolWithPrice = data.pools.find((pool: any) => pool.price?.usd > 0);
        if (poolWithPrice) {
          price = poolWithPrice.price.usd.toString();
        }
      }

      return { symbol, price, decimals };
    } else {
      logger.error({ status: response.status }, `Error: ${response.status}`);
      return null;
    }
  } catch (error) {
    logger.error({ data: error }, 'Error fetching token info:');
    return null;
  }
}

/**
 * Retrieve portfolio balances for a wallet
 * Compatible with the Birdeye client return format
 */
export async function retrievePortfolioBalances(privateKey: string): Promise<any> {
  const publicKey = getPublicKeyFromPrivateKey(privateKey);
  const API_URL = `${BASE_URL}/wallet/${publicKey}`;

  const headers = {
    'x-api-key': API_KEY,
    'accept': 'application/json',
  };

  try {
    const response = await axios.get(API_URL, { headers });

    if (response.status === 200 && response.data) {
      const data = response.data;
      const tokens = data.tokens || [];

      const solAddress = "So11111111111111111111111111111111111111111";

      let items = tokens
        .filter((token: any) => token.balance && token.balance > 0)
        .map((token: any) => {
          const pool = token.pools && token.pools.length > 0 ? token.pools[0] : null;
          const priceUsd = pool?.price?.usd || 0;

          return {
            address: token.token.mint,
            symbol: token.token.symbol,
            name: token.token.name,
            decimals: token.token.decimals,
            uiAmount: token.balance, 
            priceUsd: priceUsd,
            valueUsd: token.value || 0,
            image: token.token.image,
          };
        });

      const solItem = items.find((item: any) => item.address === solAddress);

      if (solItem) {
        items = items.filter((item: any) => item.address !== solAddress);
        items.unshift(solItem);
      }

      const totalUsd = items.reduce(
        (sum: number, item: any) => sum + (item.valueUsd || 0),
        0
      );

      const totalPositionBalance = items.reduce(
        (sum: number, item: any) =>
          sum + item.uiAmount * (item.priceUsd || 0),
        0
      );

      return {
        wallet: publicKey,
        totalUsd: totalUsd,
        items,
        totalSolBalanceUsd: solItem
          ? solItem.uiAmount * (solItem.priceUsd || 0)
          : 0,
        totalSolBalanceToken: solItem ? solItem.uiAmount : 0,
        totalPositionBalanceUsd: totalPositionBalance,
      };
    } else {
      throw new Error(`API call failed with status: ${response.status}`);
    }
  } catch (error) {
    logger.error({ data: error }, "Error fetching portfolio balances:");
    throw error;
  }
}

/**
 * Fetch token decimals from Solana Tracker
 */
export async function fetchTokenDecimals(address: string): Promise<number> {
  const apiUrl = `${BASE_URL}/tokens/${address}`;
  const headers = {
    'x-api-key': API_KEY,
    'accept': 'application/json',
  };

  try {
    const response = await axios.get(apiUrl, { headers });

    if (response.status === 200 && response.data) {
      const decimals = response.data.token?.decimals ?? 6;
      return decimals;
    } else {
      logger.error({ status: response.status }, `Failed to fetch token decimals, status: ${response.status}`);
      return 6;
    }
  } catch (error) {
    logger.error({ data: error }, "Error fetching token decimals:");
    return 6;
  }
}
