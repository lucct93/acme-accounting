import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SequelizeModuleOptions } from '@nestjs/sequelize/dist/interfaces/sequelize-options.interface';
import { config as dotenvConfig } from 'dotenv';
import { Company } from '../db/models/Company';
import { Ticket } from '../db/models/Ticket';
import { User } from '../db/models/User';

dotenvConfig();

const devConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT as string) || 5590,
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'task-dev',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

const testConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT as string) || 5590,
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_TEST_NAME || 'task-test',
  logging: false,
};

const config = process.env.NODE_ENV === 'test' ? testConfig : devConfig;

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...config,
      models: [Company, User, Ticket],
    }),
  ],
})
export class DbModule {}
