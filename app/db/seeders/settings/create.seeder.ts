import { Seeder } from "typeorm-extension";
import { DataSource } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { SystemSetting } from "../../../src/entities/system-settings.entity";
import { DataLookup } from "../../../src/entities/data-lookup.entity";
import { ObjectState } from "../../../src/utils/enums"

class CreateSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<any> {
        const repository = dataSource.getRepository(SystemSetting);
        const lookupRepository = dataSource.getRepository(DataLookup)

        const dataPath = path.join(__dirname, "data.json");
        const rawData = fs.readFileSync(dataPath, "utf8");
        const data: any[] = JSON.parse(rawData);

        const systemSetting: SystemSetting[] = [];

        const activeObjectState = await lookupRepository.findOne(
            { where: { value: ObjectState.ACTIVE } }
        )

        for (const row of data) {
            systemSetting.push(
                repository.create({
                    name: row.name,
                    code: row.code,
                    defaultValue: row.defaultValue,
                    currentValue: row.currentValue,
                    objectState: activeObjectState as DataLookup
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