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
  await sequelize.query('DELETE FROM "tickets"');
  await sequelize.query('DELETE FROM "users"');
  await sequelize.query('DELETE FROM "companies"');
});

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});
