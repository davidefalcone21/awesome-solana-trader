export interface UserRefactor {
    id: number; // Primary key
    telegram_id: number; // Unique, not nullable
    private_key?: string; // Nullable
    slippage: number; // Default 500
    telegram_username?: string; // Nullable
    buy_size: number; // Default 100000
    perc_1: number; // Default 0
    perc_2: number; // Default 0
    perc_3: number; // Default 0
    threshold_1: number; // Default 0
    threshold_2: number; // Default 0
    threshold_3: number; // Default 0
    priority_fee: number; // Default 5000000
  }
  