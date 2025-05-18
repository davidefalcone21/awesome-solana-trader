import { Secret, Token } from 'fernet';
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

import logger from './logger';
const KEY = process.env.FERNET_ENCRYPTION_KEY;

if (!KEY) {
  throw new Error('FERNET_ENCRYPTION_KEY environment variable is required');
}



export function getPublicKeyFromPrivateKey(privateKey: string): string {
  // Decode the private key from Base58
  const privateKeyDecoded = bs58.decode(privateKey);

  // Generate the Keypair using the decoded private key
  const keypair = Keypair.fromSecretKey(privateKeyDecoded);

  // Return the public key in Base58 format
  return keypair.publicKey.toBase58();
}

// Function to encrypt using Fernet
export function encrypt(plainText: string): string {
  const secret = new Secret(KEY!);

  const token = new Token({
    secret: secret,
    time: Math.floor(Date.now() / 1000), // Current time in seconds
  });

  try {
    return token.encode(plainText);
  } catch (error) {
    logger.error({ data: error }, 'Encryption failed:');
    throw new Error('Failed to encrypt data');
  }
}

// Function to decrypt using Fernet
export function decrypt(cipherText: string): string {
  const secret = new Secret(KEY!);
  const token = new Token({
    secret: secret,
    token: cipherText,
    ttl: 0, // No expiration
  });

  try {
    return token.decode();
  } catch (error) {
    logger.error({ data: error }, 'Decryption failed:');
    throw new Error('Failed to decrypt data');
  }
}
