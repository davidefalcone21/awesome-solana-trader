CREATE TABLE position (
    id SERIAL PRIMARY KEY,
    telegram_id INT NOT NULL,
    coin_symbol VARCHAR(10) NOT NULL,
    coin_address VARCHAR(255) NOT NULL,
    total_quantity NUMERIC(20, 8) NOT NULL DEFAULT 0,
    average_buy_in NUMERIC(20, 8) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (telegram_id, coin_address),
    CONSTRAINT check_positive_quantity CHECK (total_quantity >= 0),
    CONSTRAINT check_positive_price CHECK (average_buy_in >= 0)
);

CREATE INDEX idx_user_coin ON position (telegram_id, coin_address);