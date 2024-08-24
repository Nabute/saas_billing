import { Seeder } from "typeorm-extension";
import { DataSource } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { SystemSetting } from "../../../src/entities/system-settings.entity";

class CreateSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<any> {
        const repository = dataSource.getRepository(SystemSetting);

        const dataPath = path.join(__dirname, "data.json");
        const rawData = fs.readFileSync(dataPath, "utf8");
        const data: any[] = JSON.parse(rawData);

        const systemSetting: SystemSetting[] = [];

        for (const row of data) {
            systemSetting.push(
                repository.create({
                    name: row.name,
                    code: row.code,
                    defaultValue: row.defaultValue,
                    currentValue: row.currentValue,
                })
            );
        }

        await repository.upsert(systemSetting, {
            conflictPaths: ["code"],
            skipUpdateIfNoValuesChanged: true,
        });
    }
}

export default CreateSeeder;
