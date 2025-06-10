import {
    BlockhashWithExpiryBlockHeight,
    Connection,
    TransactionExpiredBlockheightExceededError,
    VersionedTransactionResponse,
  } from "@solana/web3.js";
  import promiseRetry from "promise-retry";
  import { wait } from "./wait";
  import logger from "../utils/logger";

  const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL!;

  if (!SOLANA_RPC_URL) {
    throw new Error('SOLANA_RPC_URL environment variable is required');
  }
  
  type TransactionSenderAndConfirmationWaiterArgs = {
    serializedTransaction: Buffer;
    blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
  };
  
  const SEND_OPTIONS = {
    skipPreflight: true,
  };

  export async function sendRawTransaction(
    connection: Connection,
    serializedTransaction: Buffer
  ): Promise<string> {
    const txid = await connection.sendRawTransaction(
      serializedTransaction,
      SEND_OPTIONS
    );
    logger.info({ txid: txid }, `Transaction sent with txid: ${txid}`);
    return txid;
  }
  
  export async function transactionSenderAndConfirmationWaiter({
    serializedTransaction,
    blockhashWithExpiryBlockHeight,
  }: TransactionSenderAndConfirmationWaiterArgs): Promise<VersionedTransactionResponse | null> {
    logger.info({ data: serializedTransaction }, "Sending transaction. with serializedTransaction: ");
    const connection = new Connection(SOLANA_RPC_URL!);
    let txid = ''

    try{
       txid = await connection.sendRawTransaction(
        serializedTransaction,
        SEND_OPTIONS
      );
    } catch (e) {
      return null;
    }


    logger.info({ txid: txid }, `Transaction sent with txid: ${txid}`);
  
    const controller = new AbortController();
    const abortSignal = controller.signal;
  
    const abortableResender = async () => {
      while (true) {
        await wait(2_000);
        if (abortSignal.aborted) return;
        try {
          logger.info({ txid: txid }, `Resending transaction: ${txid}`);
          await connection.sendRawTransaction(
            serializedTransaction,
            SEND_OPTIONS
          );
        } catch (e) {
          logger.warn({ e: e }, `Failed to resend transaction: ${e}`);
        }
      }
    };
  
    try {
      abortableResender();
      const lastValidBlockHeight =
        blockhashWithExpiryBlockHeight.lastValidBlockHeight - 150;
  
      // this would throw TransactionExpiredBlockheightExceededError
      await Promise.race([
        connection.confirmTransaction(
          {
            signature: txid,
            ...blockhashWithExpiryBlockHeight,
            lastValidBlockHeight,
            abortSignal,
          },
          "confirmed"
        ),
        new Promise(async (resolve) => {
          while (!abortSignal.aborted) {
            await wait(2_000);
            const tx = await connection.getSignatureStatus(txid, {
              searchTransactionHistory: false,
            });
            if (tx?.value?.confirmationStatus === "confirmed") {
              resolve(tx);
            }
          }
        }),
      ]);
    } catch (e) {
      if (e instanceof TransactionExpiredBlockheightExceededError) {
        return null;
      } else {
        throw e;
      }
    } finally {
      controller.abort();
    }
  
    const response = promiseRetry(
      async (retry) => {
        const response = await connection.getTransaction(txid, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        if (!response) {
          retry(response);
        }
        return response;
      },
      {
        retries: 5,
        minTimeout: 1e3,
      }
    );
  
    return response;
  }