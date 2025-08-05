export interface BuyOrder {
    id?: number; // Auto-increment primary key
    telegram_id: number; // Not nullable
    ca: string; // Token contract address
    coin_name: string; // Token symbol/name
    buy_price_usd: number; // Original buy price in USD (DECIMAL(18, 8))
    quantity: number; // Amount of tokens bought (DECIMAL(18, 8))
    sl_perc: number; // Stop Loss (positive) or Take Profit (negative) percentage (DECIMAL(5, 2))
    perc_to_sell: number; // Percentage of position to sell when triggered (DECIMAL(5, 2))
    status: string; // Order status: 'open', 'closed'
    private_key: string; // Encrypted private key for auto-execution
    slippage: number; // Slippage in basis points (default 500)
    telegram_username: string; // Username for logging
    priority_fee: number; // Priority fee in lamports (default 5000000)
    order_timestamp?: Date; // TIMESTAMP with default
  }
  