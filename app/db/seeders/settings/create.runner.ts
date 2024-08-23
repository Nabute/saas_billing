import { DataSource, DataSourceOptions } from "typeorm";
import { runSeeders, SeederOptions } from "typeorm-extension";
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import CreateSeeder from "./create.seeder";
import { SystemSetting } from "../../../src/entities/system-settings.entity";

// Load environment variables
config();

// Initialize ConfigService to fetch configuration values
const configService = new ConfigService();

// Define the datasource options using environment variables
const options: DataSourceOptions & SeederOptions = {
    type: "postgres",
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT')),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [SystemSetting],
    seeds: [CreateSeeder],
};

(async () => {
    // Initialize the datasource
    const dataSource = new DataSource(options);
    await dataSource.initialize();

    // Run the seeders
    await runSeeders(dataSource);
})();
