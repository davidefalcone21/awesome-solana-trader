# Database Migrations

This directory contains SQL migration files for setting up the Atlas Trading Bot database.

## Migration Order

Migrations must be run in the following order:

1. **20250101_create_users_table.sql** - Creates the `users_new` table
   - Main user configuration and settings
   - Stores encrypted private keys
   - Trading preferences and limits

2. **20250102_create_buy_order_table.sql** - Creates the `buy_order` table
   - Tracks buy order history
   - References users_new table (foreign key)

3. **20250103_create_signals_and_price_tables.sql** - Creates auxiliary tables
   - `coins_signals` - Price achievement alerts
   - `coins_price` - Historical price data

4. **20250104_position_table.sql** - Creates the `position` table
   - Tracks user token holdings
   - Average buy-in prices

5. **20250108_add_sol_avg_buy_in.sql** - Adds SOL pricing to positions
   - Adds `average_buy_in_sol` column
   - Adds validation constraint

## Running Migrations

### Option 1: Manual Execution

```bash
# Connect to your database
psql -U your_username -d atlas_bot

# Run migrations in order
\i sql/20250101_create_users_table.sql
\i sql/20250102_create_buy_order_table.sql
\i sql/20250103_create_signals_and_price_tables.sql
\i sql/20250104_position_table.sql
\i sql/20250108_add_sol_avg_buy_in.sql
```

### Option 2: Batch Execution

```bash
# From repository root
for file in sql/*.sql; do
  echo "Running $file..."
  psql -d atlas_bot -f "$file"
done
```

### Option 3: Docker Compose (Automatic)

If using docker-compose, migrations in this directory are automatically executed when the PostgreSQL container first starts:

```bash
docker-compose up -d
```

The migrations are mounted to `/docker-entrypoint-initdb.d/` and run in alphabetical order.

## Schema Overview

### Core Tables

#### `users_new`
Stores user accounts and trading configuration.

**Key columns:**
- `telegram_id` - Unique identifier from Telegram
- `private_key` - Encrypted Solana wallet private key (Fernet)
- `slippage`, `buy_size` - Trading defaults
- `priority_fee` - Transaction priority settings
- Various `perc_*` columns - Take-profit levels

#### `position`
Tracks current user token holdings.

**Key columns:**
- `telegram_id` - User identifier
- `coin_address` - SPL token mint address
- `total_quantity` - Current balance
- `average_buy_in` - Average purchase price (USD)
- `average_buy_in_sol` - Average purchase price (SOL)

#### `buy_order`
Historical record of buy transactions.

**Key columns:**
- `telegram_id` - User identifier
- `coin_address` - Token purchased
- `quantity`, `price_usd`, `price_sol` - Transaction details
- `transaction_id` - Solana transaction hash
- `status` - Order status (pending, completed, failed)

#### `coins_signals`
Price achievement alerts (for future auto-sell features).

**Key columns:**
- `coin_address` - Token address
- `initial_price`, `current_price` - Price tracking
- `signal_type` - Achievement level (3x, 5x, 10x, etc.)

#### `coins_price`
Historical price data cache.

**Key columns:**
- `coin_address` - Token address
- `price_usd`, `price_sol` - Prices
- `volume_24h`, `market_cap`, `liquidity` - Market data
- `recorded_at` - Timestamp

## Foreign Key Constraints

- `buy_order.telegram_id` → `users_new.telegram_id`
  - Cascade delete: When user is deleted, their orders are also deleted

- `position` has unique constraint on `(telegram_id, coin_address)`
  - Prevents duplicate position entries for same user+token

## Indexes

Performance indexes are created on:
- User lookups: `telegram_id`
- Auto-trade queries: `auto_trade`, `auto_sell`
- Position lookups: `(telegram_id, coin_address)`
- Price history: `(coin_address, recorded_at)`

## Notes

### Missing Tables

The code contains repositories for a `users_new_refactor` table that is not created by these migrations. This appears to be part of an incomplete refactoring effort. Currently only `sellSettings.ts` uses `UserRefactorRepository`, while all other code uses `UserRepository` with the `users_new` table.

**Recommendation**: Either complete the refactoring or remove the UserRefactorRepository.

### Security

The `users_new.private_key` column stores encrypted private keys. Ensure:
- Database connections use SSL/TLS
- Strong database passwords
- Restricted network access
- Regular backups (encrypted)
- `FERNET_ENCRYPTION_KEY` is kept secure

See [SECURITY.md](../SECURITY.md) for more details.

## Rollback

To completely reset the database:

```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS buy_order CASCADE;
DROP TABLE IF EXISTS position CASCADE;
DROP TABLE IF EXISTS coins_signals CASCADE;
DROP TABLE IF EXISTS coins_price CASCADE;
DROP TABLE IF EXISTS users_new CASCADE;
```

Then re-run migrations from step 1.

## Testing Migrations

After running migrations, verify the schema:

```sql
-- List all tables
\dt

-- Describe each table
\d users_new
\d position
\d buy_order
\d coins_signals
\d coins_price

-- Check indexes
\di

-- Verify foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## Maintenance

### Vacuum and Analyze

Periodically optimize the database:

```sql
VACUUM ANALYZE users_new;
VACUUM ANALYZE position;
VACUUM ANALYZE buy_order;
VACUUM ANALYZE coins_signals;
VACUUM ANALYZE coins_price;
```

### Backup

Regular backups are critical since this database contains encrypted user private keys:

```bash
# Backup
pg_dump -U your_username atlas_bot > backup_$(date +%Y%m%d).sql

# Restore
psql -U your_username atlas_bot < backup_20250109.sql
```
