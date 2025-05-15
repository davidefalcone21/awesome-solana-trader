import db from '../connection'; // Your pg-promise instance
import { UserRefactor } from '../models/UserRefactor';

import logger from '../../utils/logger';
export class UserRefactorRepository {

    /**
   * Retrieves all users.
   */
  static async getAllUsers(): Promise<UserRefactor[]> {
    return db.any('SELECT * FROM users_new_refactor');
  }


  /**
   * Retrieves all users with a specific Telegram username.
   */
  static async getUsers(telegram_username: string): Promise<UserRefactor[]> {
    try {
      const users = await db.any(
        `
        SELECT * FROM users_new_refactor
        WHERE telegram_username = $1
        `,
        [telegram_username]
      );
      return users;
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while fetching users: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }

  /**
   * Updates the private key (wallet) of a user by their ID.
   */
  static async updateUserWallet(user_id: number, new_wallet: string): Promise<void> {
    try {
      const result = await db.result(
        `
        UPDATE users_new_refactor
        SET private_key = $1
        WHERE telegram_id = $2
        `,
        [new_wallet, user_id]
      );

      if (result.rowCount === 0) {
        logger.info({ user_id: user_id }, `No user found with ID: ${user_id}. No updates applied.`);
      } else {
        logger.info({ user_id: user_id }, `User with ID: ${user_id} has been updated successfully.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while updating user wallet: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }

  static async getUserByTelegramId(telegram_id: number): Promise<UserRefactor | null> {
    return db.oneOrNone("SELECT * FROM users_new_refactor WHERE telegram_id = $1", [
      telegram_id,
    ]);
  }

  static async addUser(user: UserRefactor): Promise<void> {
    const query = `
      INSERT INTO users_new_refactor (
        telegram_id, telegram_username, slippage, buy_size
      ) VALUES ($1, $2, $3, $4)
    `;
    const values = [
      user.telegram_id,
      user.telegram_username,
      user.slippage || 500,
      user.buy_size || 100000,
    ];
    await db.none(query, values);
  }

  
    /**
     * Updates the priority fee of a user by their ID.
     */
    static async updatePriorityFee(userId: number, priorityFee: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET priority_fee = $1
          WHERE telegram_id = $2
          `,
          [priorityFee, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating priority fee: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }
  
    /**
     * Updates the slippage of a user by their ID.
     */
    static async updateSlippage(userId: number, slippage: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET slippage = $1
          WHERE telegram_id = $2
          `,
          [slippage, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating slippage: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }
  
    /**
     * Updates the buy size of a user by their ID.
     */
    static async updateBuySize(userId: number, buySize: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET buy_size = $1
          WHERE telegram_id = $2
          `,
          [buySize, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating buy size: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updateThreshold1(userId: number, threshold1: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET threshold_1 = $1
          WHERE telegram_id = $2
          `,
          [threshold1, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating threshold 1: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updateThreshold2(userId: number, threshold2: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET threshold_2 = $1
          WHERE telegram_id = $2
          `,
          [threshold2, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating threshold 2: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updateThreshold3(userId: number, threshold3: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET threshold_3 = $1
          WHERE telegram_id = $2
          `,
          [threshold3, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating threshold 3: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updatePerc1(userId: number, perc1: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET perc_1 = $1
          WHERE telegram_id = $2
          `,
          [perc1, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating perc 1: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updatePerc2(userId: number, perc2: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET perc_2 = $1
          WHERE telegram_id = $2
          `,
          [perc2, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating perc 2: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }

    static async updatePerc3(userId: number, perc3: number): Promise<void> {
      try {
        const result = await db.result(
          `
          UPDATE users_new_refactor
          SET perc_3 = $1
          WHERE telegram_id = $2
          `,
          [perc3, userId]
        );
  
        if (result.rowCount === 0) {
          logger.info({ userId: userId }, `No user found with ID: ${userId}. No updates applied.`);
        } else {
          logger.info({ userId: userId }, `User with ID: ${userId} has been updated successfully.`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error({ message: error.message }, `Error occurred while updating perc 3: ${error.message}`);
        } else {
          logger.error({ data: error }, 'Unexpected error:');
        }
        throw error;
      }
    }


  // New helper function to add a user with only partial fields
  static async addPartialUser(partialUser: {
    telegram_id: number;
    telegram_username: string;
    slippage?: number;
    buy_size?: number;
  }): Promise<void> {
    const defaultUser: UserRefactor = {
      id: 0, // Auto-incremented by the database, so set to 0 or undefined
      telegram_id: partialUser.telegram_id,
      telegram_username: partialUser.telegram_username,
      slippage: partialUser.slippage ?? 500,
      buy_size: partialUser.buy_size ?? 100000,
      perc_1: 0,
      perc_2: 0,
      perc_3: 0,
      threshold_1: 0,
      threshold_2: 0,
      threshold_3: 0,
      priority_fee: 5000000,
    };

    await this.addUser(defaultUser);
  }

}
