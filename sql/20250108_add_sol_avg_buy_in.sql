ALTER TABLE position 
ADD COLUMN average_buy_in_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
ADD CONSTRAINT check_positive_price_sol CHECK (average_buy_in_sol >= 0);