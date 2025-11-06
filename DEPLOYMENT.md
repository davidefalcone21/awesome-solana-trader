# Deployment Guide - Atlas Solana Trading Bot

## Quick Deployment Checklist

- [ ] Set up all environment variables in `.env`
- [ ] Run database migrations
- [ ] Test locally first
- [ ] Deploy to hosting platform
- [ ] Monitor logs for errors

---

## Option 1: Deploy to Fly.io (Recommended)

### Why Fly.io?
- **Cost-effective**: $0-3/month for small apps
- **Better performance**: Optimized for long-running processes
- **Can use existing Heroku Postgres**: Just use the external connection string

### Prerequisites
- Fly.io account
- Heroku Postgres database (or any PostgreSQL database)
- All environment variables ready in `.env`

### Steps

**1. Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

**2. Login:**
```bash
fly auth login
```

**3. Create `fly.toml` in project root:**
```toml
app = "atlas-trading-bot"
primary_region = "lhr"  # London - change as needed

[build]

[env]
  JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote"
  JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap"
  PLATFORM_FEE_BPS = "100"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

**4. Set secrets:**
```bash
fly secrets set TELEGRAM_BOT_TOKEN=your_token_here
fly secrets set DATABASE_URL=your_postgres_url
fly secrets set FERNET_ENCRYPTION_KEY=your_key_here
fly secrets set SOLANA_RPC_URL=your_rpc_url
fly secrets set BIRDEYE_API_KEY=your_key_here
fly secrets set PLATFORM_FEE_WALLET=your_wallet_address
```

**5. Deploy:**
```bash
fly launch  # First time
fly deploy  # Subsequent deployments
```

**6. Monitor:**
```bash
fly logs
fly status
```

---

## Option 2: Deploy to Heroku

### Prerequisites
- Heroku account
- Heroku Postgres add-on already provisioned
- Heroku CLI installed

### Steps

**1. Create `Procfile` in project root:**
```
worker: npm start
```

**2. Login to Heroku:**
```bash
heroku login
```

**3. Create app (if not exists):**
```bash
heroku create atlas-trading-bot
```

**4. Set environment variables:**
```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_token_here
heroku config:set DATABASE_URL=your_heroku_postgres_url
heroku config:set FERNET_ENCRYPTION_KEY=your_key_here
heroku config:set SOLANA_RPC_URL=your_rpc_url
heroku config:set JUPITER_QUOTE_URL=https://quote-api.jup.ag/v6/quote
heroku config:set JUPITER_SWAP_URL=https://quote-api.jup.ag/v6/swap
heroku config:set BIRDEYE_API_KEY=your_key_here
heroku config:set PLATFORM_FEE_WALLET=your_wallet_address
heroku config:set PLATFORM_FEE_BPS=100
```

**5. Deploy:**
```bash
git push heroku master
# or if on different branch:
git push heroku your-branch:master
```

**6. Scale worker dyno:**
```bash
heroku ps:scale worker=1
```

**7. Check logs:**
```bash
heroku logs --tail
```

---

## Database Setup

### Run Migrations

If using Heroku Postgres:
```bash
heroku pg:psql < sql/20250110_cleanup_unused_columns.sql
```

If using another PostgreSQL instance:
```bash
psql $DATABASE_URL -f sql/20250110_cleanup_unused_columns.sql
```

### Table Used
The bot uses the `users_new_refactor` table with the following schema:
- `telegram_id`, `telegram_username`, `private_key` (encrypted)
- Trading settings: `buy_size`, `slippage`, `priority_fee`
- Sell settings: `threshold_1/2/3` (TP/SL %), `perc_1/2/3` (% to sell)

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather | `123456:ABC-DEF...` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `FERNET_ENCRYPTION_KEY` | ✅ | Encryption key for private keys | Generate with Python |
| `SOLANA_RPC_URL` | ✅ | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `BIRDEYE_API_KEY` | ✅ | Birdeye API key | From birdeye.so |
| `PLATFORM_FEE_WALLET` | ✅ | Wallet for collecting fees | Your Solana address |
| `JUPITER_QUOTE_URL` | ❌ | Jupiter quote API | Default: `https://quote-api.jup.ag/v6/quote` |
| `JUPITER_SWAP_URL` | ❌ | Jupiter swap API | Default: `https://quote-api.jup.ag/v6/swap` |
| `PLATFORM_FEE_BPS` | ❌ | Platform fee (basis points) | Default: `100` (1%) |

### Generating Encryption Key

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Testing Before Deployment

### Run Locally

```bash
# Install dependencies
npm install

# Set up .env file
cp .env.example .env
# Edit .env with your actual credentials

# Start the bot
npm start
```

### Test with Docker

```bash
# Build and run
docker-compose up

# Check logs
docker-compose logs -f bot
```

---

## Post-Deployment

### 1. Verify Bot is Running

Send `/start` to your bot on Telegram. You should see the welcome menu.

### 2. Test Basic Operations

1. Set wallet (import private key)
2. Configure buy settings (buy size, slippage, priority fee)
3. Configure sell settings (thresholds and percentages)
4. Try a small test trade

### 3. Monitor Logs

**Fly.io:**
```bash
fly logs
```

**Heroku:**
```bash
heroku logs --tail
```

### 4. Common Issues

**Bot not responding:**
- Check `TELEGRAM_BOT_TOKEN` is correct
- Verify bot process is running: `fly status` or `heroku ps`
- Check logs for errors

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment platform
- Ensure migrations have been run

**Transaction failures:**
- Verify `SOLANA_RPC_URL` is responsive
- Check user has sufficient SOL for gas
- Try increasing slippage tolerance

---

## Security Reminders

⚠️ **CRITICAL:**
- Never commit `.env` file to git
- Rotate all credentials before going live
- Use strong, unique encryption keys
- Monitor for suspicious activity
- Implement transaction limits
- Regular backups of database

---

## Cost Estimates

### Fly.io
- **Hobby plan**: ~$0-3/month
- **Shared CPU + 256MB RAM**: Sufficient for Telegram bot
- **Free tier**: 3 shared-cpu-1x VMs (may be enough!)

### Heroku
- **Hobby dyno**: $7/month
- **Mini PostgreSQL**: $5/month
- **Total**: ~$12/month

**Recommendation**: Start with Fly.io for cost savings.

---

## Scaling Considerations

For production/high traffic:
- Upgrade to dedicated CPU on Fly.io or Professional dynos on Heroku
- Use connection pooling (PgBouncer) for database
- Implement rate limiting
- Add monitoring (Sentry, DataDog)
- Consider Redis for session management
