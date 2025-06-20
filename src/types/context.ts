import { Context } from 'telegraf';

export interface SessionData {
  step?: number;
  menu?: string;
  page?: number;
  ca?: string;
  tickerFormat?: string;
  currentPrice?: number;
  currentMarketCap?: string;
  liquidity?: string;
  amount?: number;
  sell_coin_data?: any;
  sell_coin_address?: string;
  sell_coin_symbol?: string;
  sell_coin_balance?: number;
  sell_coin_price?: number;
  sell_percentage?: number;
  sell_amount?: number;
  [key: string]: any;
}

export interface BotContext extends Context {
  session: SessionData;
}
