-- Create users_new table
-- This is the main user configuration table

CREATE TABLE users_new (
    id SERIAL PRIMARY KEY,
    telegram_id INT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    private_key VARCHAR(500),
    auto_trade BOOLEAN DEFAULT false,
    auto_sell BOOLEAN DEFAULT false,
    slippage INT DEFAULT 500,
    buy_size BIGINT DEFAULT 100000,
    perc_3x NUMERIC DEFAULT 0,
    perc_5x NUMERIC DEFAULT 0,
    perc_10x NUMERIC DEFAULT 0,
    perc_25x NUMERIC DEFAULT 0,
    perc_50x NUMERIC DEFAULT 0,
    perc_100x NUMERIC DEFAULT 0,
    tsl_percentuale NUMERIC DEFAULT 0,
    perc_to_sell NUMERIC DEFAULT 0,
    tsl_slippage INT DEFAULT 500,
    sl_perc NUMERIC DEFAULT 0,
    sl_perc_to_sell NUMERIC DEFAULT 0,
    sl_slippage INT DEFAULT 500,
    priority INT DEFAULT 1,
    priority_fee BIGINT DEFAULT 5000000,
    degen_mode BOOLEAN DEFAULT false,
    degen_buy_size BIGINT DEFAULT 100000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on telegram_id for faster lookups
CREATE INDEX idx_users_telegram_id ON users_new (telegram_id);
CREATE INDEX idx_users_auto_trade ON users_new (auto_trade) WHERE auto_trade = true;
CREATE INDEX idx_users_auto_sell ON users_new (auto_sell) WHERE auto_sell = true;

-- Comments for documentation
COMMENT ON TABLE users_new IS 'Main user configuration and settings';
COMMENT ON COLUMN users_new.private_key IS 'Encrypted Solana private key (Fernet)';
COMMENT ON COLUMN users_new.slippage IS 'Slippage tolerance in basis points (500 = 5%)';
COMMENT ON COLUMN users_new.buy_size IS 'Default buy size in lamports';
COMMENT ON COLUMN users_new.priority_fee IS 'Transaction priority fee in lamports';
