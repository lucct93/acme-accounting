import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { DbModule } from '../db.module';

let sequelize: Sequelize;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [DbModule],
  }).compile();
  
  sequelize = moduleRef.get<Sequelize>(Sequelize);
});

beforeEach(async () => {
  if (!sequelize) return;
  
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query('DELETE FROM "tickets"', { transaction });
    await sequelize.query('DELETE FROM "users"', { transaction });
    await sequelize.query('DELETE FROM "companies"', { transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    try {
      await sequelize.query('DELETE FROM "tickets"');
      await sequelize.query('DELETE FROM "users"');
      await sequelize.query('DELETE FROM "companies"');
    } catch (deleteErr) {
      // ignore
    }
  }
});

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});