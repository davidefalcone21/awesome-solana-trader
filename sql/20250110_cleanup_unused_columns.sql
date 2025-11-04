-- Cleanup unused columns from users_new_refactor table
-- This migration removes fields that are no longer used in the application

-- Remove auto_trade and auto_sell (no handlers exist)
ALTER TABLE users_new_refactor DROP COLUMN IF EXISTS auto_trade;
ALTER TABLE users_new_refactor DROP COLUMN IF EXISTS auto_sell;

-- Remove degen_mode and degen_buy_size (feature removed)
ALTER TABLE users_new_refactor DROP COLUMN IF EXISTS degen_mode;
ALTER TABLE users_new_refactor DROP COLUMN IF EXISTS degen_buy_size;

-- Remove priority field (not used in application logic)
ALTER TABLE users_new_refactor DROP COLUMN IF EXISTS priority;

-- Add comment explaining the simplified schema
COMMENT ON TABLE users_new_refactor IS 'User configuration and settings - simplified schema without unused features';
COMMENT ON COLUMN users_new_refactor.threshold_1 IS 'Take profit (positive) or stop loss (negative) threshold 1 in percentage';
COMMENT ON COLUMN users_new_refactor.threshold_2 IS 'Take profit (positive) or stop loss (negative) threshold 2 in percentage';
COMMENT ON COLUMN users_new_refactor.threshold_3 IS 'Take profit (positive) or stop loss (negative) threshold 3 in percentage';
COMMENT ON COLUMN users_new_refactor.perc_1 IS 'Percentage of position to sell when threshold_1 is reached';
COMMENT ON COLUMN users_new_refactor.perc_2 IS 'Percentage of position to sell when threshold_2 is reached';
COMMENT ON COLUMN users_new_refactor.perc_3 IS 'Percentage of position to sell when threshold_3 is reached';
