import axios from 'axios';
import logger from '../utils/logger';
export interface TokenData {
  priceUsd: number;
  liquidityUsd: number ;
  fdv: number;
  volume_5m: number;
  volume_1h: number;
  volume_6h: number;
  volume_24h: number;
  ticker: string;
  success: boolean;
}
export async function fetchTokenData(tokenAddress: string): Promise<TokenData> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const data = response.data;
      const pairs = data.pairs || [];
      if (pairs.length > 0) {
        const pair = pairs[0]; 
        const priceUsd = pair.priceUsd || null;
        const liquidityUsd = pair.liquidity?.usd || null;
        const fdv = pair.fdv || null;
        const volume_5m = pair.volume?.m5 ?? -1;
        const volume_1h = pair.volume?.h1 ?? -1;
        const volume_6h = pair.volume?.h6 ?? -1;
        const volume_24h = pair.volume?.h24 ?? -1;
        const ticker = pair.baseToken?.symbol || 'MISSING';
        return {
          priceUsd,
          liquidityUsd,
          fdv,
          volume_5m,
          volume_1h,
          volume_6h,
          volume_24h,
          ticker,
          success: true,
        };
      }
    } else {
      logger.error({ status: response.status }, `Failed to fetch token data, status code: ${response.status}`);
    }
  } catch (error) {
    logger.error({ data: error }, 'Error fetching token data:');
  }
  return {
    priceUsd: -1,
    liquidityUsd: -1,
    fdv: -1,
    volume_5m: -1,
    volume_1h: -1,
    volume_6h: -1,
    volume_24h: -1,
    ticker: 'MISSING',
    success: false,
  };
}
/**
 * Fetches basic token information (symbol and price) from DexScreener.
 * Note: decimals field is set to 0 as DexScreener doesn't provide it.
 */
export async function fetchTokenInfo(tokenAddress: string): Promise<{ symbol: string; price: string; decimals: number } | null> {
  const tokenData = await fetchTokenData(tokenAddress);
  if (tokenData.success && tokenData.ticker !== 'MISSING' && tokenData.priceUsd > 0) {
    return {
      symbol: tokenData.ticker,
      price: tokenData.priceUsd.toString(),
      decimals: 0,
    };
  }
  return null;
}
/**
 * Fetches current prices for multiple tokens in a single batch request.
 * Maximum of 30 addresses per request (DexScreener limit).
 */
export async function fetchMultipleTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) {
    return {};
  }
  if (tokenAddresses.length > 30) {
    logger.warn({ count: tokenAddresses.length }, `fetchMultipleTokenPrices: Truncating ${tokenAddresses.length} addresses to max of 30`);
    tokenAddresses = tokenAddresses.slice(0, 30);
  }
  const url = `https://api.dexscreener.com/tokens/v1/solana/${tokenAddresses.join(',')}`;
  const priceMap: Record<string, number> = {};
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      const pairs = Array.isArray(response.data) ? response.data : (response.data.pairs || []);
      for (const pair of pairs) {
        const baseTokenAddress = pair.baseToken?.address;
        const priceUsd = parseFloat(pair.priceUsd);
        if (baseTokenAddress && !isNaN(priceUsd) && priceUsd > 0) {
          if (!priceMap[baseTokenAddress] || pair.liquidity?.usd > 0) {
            priceMap[baseTokenAddress] = priceUsd;
          }
        }
      }
    } else {
      logger.error({ status: response.status }, `Failed to fetch token prices, status: ${response.status}`);
    }
  } catch (error) {
    logger.error({ data: error }, 'Error fetching token prices:');
  }
  return priceMap;
}
