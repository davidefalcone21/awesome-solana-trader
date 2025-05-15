import db from '../connection'; // Your pg-promise instance
import { Position } from '../models/Position';

import logger from '../../utils/logger';
export class PositionRepository {
  static async getPosition(telegramId: number, ca: string): Promise<Position | null> {
    return db.oneOrNone(`
      SELECT * FROM position 
      WHERE telegram_id = \${telegramId} 
      AND coin_address = \${ca}`, 
      {telegramId: telegramId, ca: ca}
    );
  }

  static async getUserPositions(telegramId: number): Promise<Position[]> {
    return (await db.any(`
      SELECT * FROM position 
      WHERE telegram_id = \${telegramId}`, 
      {telegramId: telegramId}
    ));
  }

  static async upsert(position: Position): Promise<void> {
    const query = `
      INSERT INTO position (telegram_id, coin_symbol, coin_address, total_quantity, average_buy_in, average_buy_in_sol, last_updated)
      VALUES (\${telegram_id}, \${coin_symbol}, \${coin_address}, \${total_quantity}, \${average_buy_in}, \${average_buy_in_sol}, CURRENT_TIMESTAMP)
      ON CONFLICT (telegram_id, coin_address)
      DO UPDATE SET
        total_quantity = position.total_quantity + EXCLUDED.total_quantity,
        average_buy_in = CASE
          WHEN (position.total_quantity + EXCLUDED.total_quantity) = 0 THEN position.average_buy_in
          ELSE
            (position.total_quantity * position.average_buy_in + 
             EXCLUDED.total_quantity * EXCLUDED.average_buy_in) / 
            (position.total_quantity + EXCLUDED.total_quantity)
          END,
        average_buy_in_sol = CASE
          WHEN (position.total_quantity + EXCLUDED.total_quantity) = 0 THEN position.average_buy_in_sol
          ELSE
            (position.total_quantity * position.average_buy_in_sol + 
             EXCLUDED.total_quantity * EXCLUDED.average_buy_in_sol) / 
            (position.total_quantity + EXCLUDED.total_quantity)
          END,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    await db.one(query, position)
      .then(row => {
        logger.info({updatedRow: row, input: position}, "Upserted position")
      })
      .catch(err => {
        logger.error({ data: err }, `Unxpected error while upserting positon ${position}`)
      });
  }

  static async decreaseQuantity(telegramId: number, ca: string, decreaseQty: number): Promise<void> {
    const query = `
      UPDATE position
      SET total_quantity = total_quantity - \${decreaseQty},
      last_updated = CURRENT_TIMESTAMP
      WHERE telegram_id = \${telegramId} 
      AND coin_address = \${ca}
      RETURNING *
    `;
    const params = {telegramId: telegramId, ca: ca, decreaseQty: decreaseQty};

    await db.one(query, params)
      .then(row => {
        logger.info({updatedRow: row, input: params}, "Updated position total quantity")
      })
      .catch(err => {
        logger.error({ data: err }, `Unxpected error while updating total quantity for user ${telegramId} and ca ${ca}`)
      });
  }
}
