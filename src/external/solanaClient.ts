import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';
const RPC_URL = process.env.SOLANA_RPC_URL!;
if (!RPC_URL) {
  throw new Error('SOLANA_RPC_URL environment variable is required');
}
/**
 * Fetch the token holdings of a given wallet address.
 *
 * @param connection - A Solana connection object
 * @param walletAddress - The wallet's public key (string or PublicKey)
 * @returns A promise resolving to an array of token holdings
 */
async function getTokenHoldings(
  connection: Connection,
  walletAddress: string | PublicKey
): Promise<{ mint: string; symbol?: string; amount: string }[]> {
  const publicKey = typeof walletAddress === 'string' ? new PublicKey(walletAddress) : walletAddress;
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program ID
  });
  const tokenHoldings = tokenAccounts.value
    .filter((account: any) => {
      const parsedData = account.account.data.parsed;
      return parsedData.info.tokenAmount.uiAmount > 0; 
    })
    .map((account: any) => {
      const parsedData = account.account.data.parsed;
      return {
        mint: parsedData.info.mint,
        amount: parsedData.info.tokenAmount.uiAmount.toString(),
        symbol: undefined, 
      };
    });
  return tokenHoldings;
}
