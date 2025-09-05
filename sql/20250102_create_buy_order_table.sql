-- Create buy_order table
-- Tracks individual buy orders with Stop Loss / Take Profit monitoring
-- Each buy can create up to 3 orders (one per threshold if configured)

CREATE TABLE IF NOT EXISTS buy_order (
    id SERIAL PRIMARY KEY,
    telegram_id INT NOT NULL,
    ca VARCHAR(255) NOT NULL,
    coin_name VARCHAR(50) NOT NULL,
    buy_price_usd NUMERIC(18, 8) NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    sl_perc NUMERIC(5, 2) NOT NULL DEFAULT 0,
    perc_to_sell NUMERIC(5, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    private_key TEXT NOT NULL,
    slippage INT NOT NULL DEFAULT 500,
    telegram_username VARCHAR(255) NOT NULL,
    priority_fee BIGINT NOT NULL DEFAULT 5000000,
    order_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_buy_order_user FOREIGN KEY (telegram_id) REFERENCES users_new_refactor(telegram_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buy_order_user ON buy_order (telegram_id);
CREATE INDEX IF NOT EXISTS idx_buy_order_ca ON buy_order (ca);
CREATE INDEX IF NOT EXISTS idx_buy_order_status ON buy_order (status);
CREATE INDEX IF NOT EXISTS idx_buy_order_timestamp ON buy_order (order_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_buy_order_open_sltp ON buy_order (status, sl_perc) WHERE status = 'open' AND sl_perc != 0;

-- Comments
COMMENT ON TABLE buy_order IS 'Tracks buy orders with SL/TP. Each buy creates 1-3 orders (one per active threshold)';
COMMENT ON COLUMN buy_order.buy_price_usd IS 'Original buy price in USD - used to calculate % change';
COMMENT ON COLUMN buy_order.sl_perc IS 'Positive = Stop Loss (e.g. 20 = sell at -20%), Negative = Take Profit (e.g. -50 = sell at +50%)';
COMMENT ON COLUMN buy_order.perc_to_sell IS 'Percentage of position to sell when triggered (0-100)';
COMMENT ON COLUMN buy_order.status IS 'Order status: open (monitoring), closed (triggered/sold)';
