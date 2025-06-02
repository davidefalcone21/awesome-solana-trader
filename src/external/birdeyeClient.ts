import axios from 'axios';
import { getPublicKeyFromPrivateKey } from '../utils/encryption'

import logger from '../utils/logger';
const API_KEY = process.env.BIRDEYE_API_KEY;
const CHAIN = "solana";

if (!API_KEY) {
  throw new Error('BIRDEYE_API_KEY environment variable is required');
}

export interface TokenInfo {
  symbol: string;
  price: string;
  decimals: number;
}

export async function fetchTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  const apiUrl = 'https://public-api.birdeye.so/defi/token_overview';
  const headers = {
    'X-API-KEY': API_KEY,
    accept: 'application/json',
    'x-chain': 'solana',
  };

  // Create the full URL with the token address
  const url = `${apiUrl}?address=${tokenAddress}`;

  try {
    // Make the API request
    const response = await axios.get(url, { headers });

    // Check if the request was successful
    if (response.status === 200) {
      const data = response.data?.data || {};

      if (Object.keys(data).length > 0) {
        // Extract and return the coin's symbol, price, and decimals
        const symbol = data.symbol || 'MISSING';
        const price = data.price || '0.0';
        const decimals = data.decimals ?? 6;

        return { symbol, price, decimals };
      } else {
        return null;
      }
    } else {
      logger.error({ status: response.status }, `Error: ${response.status}`);
      return null;
    }
  } catch (error) {
    logger.error({ data: error }, 'Error fetching token info:');
    return null;
  }
}

export async function retrievePortfolioBalances(privateKey: string): Promise<any> {
  const API_URL = "https://public-api.birdeye.so/v1/wallet/token_list";
  const publicKey = getPublicKeyFromPrivateKey(privateKey); // Replace with actual keypair logic

  const headers = {
    "X-API-KEY": API_KEY,
    "x-chain": "solana",
  };

  const params = { wallet: publicKey };

  try {
    const response = await axios.get(API_URL, { headers, params });

    if (response.data.success) {
      let items = response.data.data.items.filter((item: any) => item.uiAmount);

      // Prioritize SOL token
      const solAddress = "So11111111111111111111111111111111111111111";
      const solItem = items.find((item: any) => item.address === solAddress);
      if (solItem) {
        items = items.filter((item: any) => item.address !== solAddress);
        items.unshift(solItem);
      }

      const totalPositionBalance = items.reduce(
        (sum: number, item: any) =>
          sum + item.uiAmount * (item.priceUsd || 0),
        0
      );

      return {
        wallet: response.data.data.wallet,
        totalUsd: response.data.data.totalUsd,
        items,
        totalSolBalanceUsd: solItem
          ? solItem.uiAmount * (solItem.priceUsd || 0)
          : 0,
        totalSolBalanceToken: solItem ? solItem.uiAmount : 0,
        totalPositionBalanceUsd: totalPositionBalance,
      };
    } else {
      throw new Error("API call failed");
    }
  } catch (error) {
    logger.error({ data: error }, "Error fetching portfolio balances:");
    throw error;
  }
}

export async function fetchTokenDecimals(address: string): Promise<number> {
  const apiUrl = `https://public-api.birdeye.so/defi/token_overview?address=${address}`;
  const headers = {
    "X-API-KEY": API_KEY,
    "accept": "application/json",
    "x-chain": CHAIN,
  };

  try {
    const response = await axios.get(apiUrl, { headers });

    if (response.status === 200) {
      const data = response.data?.data || {};
      const decimals = data.decimals ?? 6; // Default to 6 if not found
      return decimals;
    } else {
      logger.error({ status: response.status }, `Failed to fetch token decimals, status: ${response.status}`);
      return 6; // Default to 6 if API call fails
    }
  } catch (error) {
    logger.error({ data: error }, "Error fetching token decimals:");
    return 6; // Default to 6 if an exception occurs
  }
}