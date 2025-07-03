import { Test } from '@nestjs/testing';
import { DestroyOptions } from 'sequelize';
import { Model, ModelCtor, Sequelize } from 'sequelize-typescript';
import { Company } from '../../db/models/Company';
import { Ticket } from '../../db/models/Ticket';
import { User } from '../../db/models/User';
import { DbModule } from '../db.module';

let sequelizeInstance: Sequelize;

beforeEach(async () => {
  jest.restoreAllMocks();
  await cleanTables();
});

// Close database connection after all tests
afterAll(async () => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
  }
});

export async function cleanTables() {
  const moduleRef = await Test.createTestingModule({
    imports: [DbModule],
  }).compile();

  sequelizeInstance = moduleRef.get<Sequelize>(Sequelize);

  const models: ModelCtor<Model>[] = [Ticket, User, Company];
  for (const model of models) {
    await cleanTable(model);
  }

  async function cleanTable<T extends Model>(model: ModelCtor<T>) {
    const options: DestroyOptions = {
      where: {},
    };
    try {
      await model.unscoped().destroy(options);
    } catch (err) {
      // https://github.com/sequelize/sequelize/issues/14807
      console.error(err as Error);
      throw err;
    }
  }
}
