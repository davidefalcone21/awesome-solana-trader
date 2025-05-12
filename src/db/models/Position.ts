export interface Position {
    id: number; // Unique identifier
    telegram_id: number; // Link to the user who owns the position
    coin_symbol: string; // The coin symbol (e.g., SOL, USDC)
    coin_address: string; // Contract address of the coin
    total_quantity: number; // Total amount of the coin held by the user
    average_buy_in: number; // Weighted average price of the user's holdings for this coin
    average_buy_in_sol: number; // Weighted average price of the user's holdings for this coin
    last_updated: Date; // Timestamp for tracking updates
  }