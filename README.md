# Awesome Solana Trader

<div align="center">

![Awesome Solana Trader](https://github.com/user-attachments/assets/d347234e-3e81-4a0f-8caf-cb5d14e0afcc)

**A powerful Telegram bot for trading SPL tokens on Solana with automated stop-loss and take-profit orders**

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-purple.svg)](https://solana.com/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://core.telegram.org/bots/api)

</div>

---

## Screenshots & Demo

![Main Interface](https://github.com/user-attachments/assets/af90dcc7-41c2-4b57-9195-fa8111454e1b)
![Buy Flow](https://github.com/user-attachments/assets/058548e1-3147-4e6f-bdff-43ea37f7be87)
![Portfolio View](https://github.com/user-attachments/assets/35b7027d-3106-4766-bb56-c49d9a2c1ad5)
![Stop Loss View](https://github.com/user-attachments/assets/2cb89576-0f88-4931-921c-dc016af4082a)

## Features

- **One-Click Trading** - Buy/sell SPL tokens directly from Telegram
- **Jupiter Integration** - Optimal swap routes using Jupiter DEX aggregator  
- **Real-time Portfolio** - Live token balances and P&L tracking
- **Stop-Loss & Take-Profit** - Automated order execution (up to 3 thresholds per buy)
- **Secure Storage** - Encrypted private key storage with Fernet encryption
- **Configurable Settings** - Slippage, buy amounts, priority fees

##  Try It Now

The bot is live and ready to use! Start trading Solana tokens immediately:

**|> [Start Awesome Solana Trader Bot](https://t.me/YourBotUsernameBot) <|**

> Simply click the link above or search for `@YourBotUsernameBot` in Telegram. Type `/start` to begin!

### Getting Started:
1. Click the bot link above
2. Type `/start` to initialize  
3. Follow the setup prompts to import your wallet
4. Start trading with the Buy/Sell/Portfolio buttons

---

## Self-Host Setup


Want to run your own instance? Here's how:

### Docker Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/awesome-solana-trader.git
cd awesome-solana-trader

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start with Docker
docker-compose up -d

# Check logs
docker-compose logs -f bot
```

### Manual Setup

```bash
# Install dependencies
npm install

# Set up PostgreSQL database
createdb solana_trader_bot
psql solana_trader_bot -f sql/20250101_create_users_table.sql
psql solana_trader_bot -f sql/20250102_create_buy_order_table.sql
psql solana_trader_bot -f sql/20250103_create_signals_and_price_tables.sql
psql solana_trader_bot -f sql/20250104_position_table.sql
psql solana_trader_bot -f sql/20250108_add_sol_avg_buy_in.sql

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Build and start
npm run build
npm start
```

## Configuration

### Required Environment Variables

```env
# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solana_trader_bot

# Encryption (generate with: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
FERNET_ENCRYPTION_KEY=your_32_byte_base64_key_here

# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Jupiter DEX
JUPITER_QUOTE_URL=https://quote-api.jup.ag/v6/quote
JUPITER_SWAP_URL=https://quote-api.jup.ag/v6/swap

# Solana Tracker API (get from solanatracker.io)
SOLANA_TRACKER_API_KEY=your_api_key_here

# Platform Fees
PLATFORM_FEE_WALLET=your_wallet_address_here
PLATFORM_FEE_BPS=100  # 1% = 100 basis points
```

# Platform Fees

Platform fees are currently **disabled** but can be enabled by configuring the `PLATFORM_FEE_WALLET` environment variable. When enabled, a configurable percentage (default 1%) is collected on all trades.

## Bot Commands

The bot currently supports these Telegram commands:

- `/start` - Initialize bot and show main menu
- `/buy` - Access buy interface via main menu buttons  
- `/sell` - Access sell interface via main menu buttons 
- `/positions` - View portfolio via main menu 

> **Note**: The bot uses button-based interactions. Type `/start` to access the main menu with Buy, Sell, and Portfolio buttons.

## Security

### Important Security Notice

This bot stores encrypted private keys in a PostgreSQL database. While encrypted with Fernet, this approach has inherent risks:

- **Database breaches** could expose encrypted keys
- **Encryption key exposure** would compromise all wallets
- Consider this for **educational/personal use only**

### Production Security Recommendations

For production use with significant funds, consider these alternatives:
- **Hardware Wallet Integration** - Use Ledger/Trezor for signing
- **MPC Wallets** - Multi-Party Computation for distributed keys
- **User-Controlled Signing** - Let users sign in their own wallets

### Security Best Practices

-  Rotate all credentials before deployment
-  Use strong, unique passwords for database
-  Enable SSL/TLS for all connections
-  Regular security audits

## ️ Development

### Available Scripts

```bash
npm start          # Start production bot
npm run dev        # Development mode
npm run build      # Compile TypeScript
```

## Contributing

Contributions are super welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Disclaimer

**Trading cryptocurrencies involves substantial risk of loss.** This software is provided "as is" without warranty. The authors are not responsible for financial losses, security breaches, API failures, or any other issues.

**Use at your own risk. Test with small amounts first.**

## Acknowledgments

- [Jupiter](https://jup.ag/) - DEX aggregation protocol
- [Solana](https://solana.com/) - High-performance blockchain
- [Telegraf](https://telegraf.js.org/) - Modern Telegram Bot framework
- [Solana Tracker](https://solanatracker.io/) - Portfolio and price data

---

<div align="center">

**Star this repo if you found it helpful!**



</div>
