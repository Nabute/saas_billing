import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load .env file manually
dotenv.config();

const config = new ConfigService();

export const dataSrouceOptions: DataSourceOptions = {
  type: 'postgres',
  database: config.get('DB_NAME'),
  host: config.get('DB_HOST'),
  port: parseInt(config.get('DB_PORT') as string),
  username: config.get('DB_USER'),
  password: config.get('DB_PASSWORD'),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSrouceOptions);

export default dataSource;
