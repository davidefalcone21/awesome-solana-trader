import db from '../connection'; // Your pg-promise instance
import { BuyOrder } from '../models/BuyOrder';

import logger from '../../utils/logger';
export class BuyOrderRepository {
  /**
   * Adds a buy order to the database.
   * Multiple orders can exist for the same CA/user (one per threshold).
   */
  static async addBuyOrder(order: Omit<BuyOrder, 'id' | 'order_timestamp'>): Promise<void> {
    try {
      // Insert the new order
      await db.none(
        `
        INSERT INTO buy_order (
          telegram_id, ca, coin_name, buy_price_usd, quantity,
          sl_perc, perc_to_sell, status, private_key, slippage,
          telegram_username, priority_fee
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          order.telegram_id,
          order.ca,
          order.coin_name,
          order.buy_price_usd,
          order.quantity,
          order.sl_perc,
          order.perc_to_sell,
          order.status,
          order.private_key,
          order.slippage,
          order.telegram_username,
          order.priority_fee,
        ]
      );

      logger.info({ ca: order.ca }, `Buy order for CA: ${order.ca} with sl_perc: ${order.sl_perc}% added successfully.`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while adding buy order: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }

  /**
   * Retrieves all open buy orders.
   */
  static async getOpenBuyOrders(): Promise<BuyOrder[]> {
    try {
      const openOrders = await db.any(
        `
        SELECT * FROM buy_order
        WHERE status = 'open'
        `
      );
      return openOrders;
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while fetching open buy orders: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }

  /**
   * Updates the status of an order to 'closed' given the order ID.
   */
  static async closeOrder(order_id: number): Promise<void> {
    try {
      const result = await db.result(
        `
        UPDATE buy_order
        SET status = 'closed'
        WHERE id = $1
        `,
        [order_id]
      );

      if (result.rowCount === 0) {
        logger.info({ order_id: order_id }, `No order found with ID: ${order_id}.`);
      } else {
        logger.info({ order_id: order_id }, `Order with ID: ${order_id} has been closed.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while closing order: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }

  /**
   * Closes all open orders for a specific coin and telegram user.
   * Used when user manually sells a position.
   */
  static async closeOrdersByCA(telegram_id: number, ca: string): Promise<number> {
    try {
      const result = await db.result(
        `
        UPDATE buy_order
        SET status = 'closed'
        WHERE telegram_id = $1 AND ca = $2 AND status = 'open'
        `,
        [telegram_id, ca]
      );

      logger.info({ rowCount: result.rowCount }, `Closed ${result.rowCount} open order(s) for CA: ${ca}, telegram_id: ${telegram_id}`);
      return result.rowCount;
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ message: error.message }, `Error occurred while closing orders by CA: ${error.message}`);
      } else {
        logger.error({ data: error }, 'Unexpected error:');
      }
      throw error;
    }
  }
}
