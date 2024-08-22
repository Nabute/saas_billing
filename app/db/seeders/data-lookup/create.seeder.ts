import { Seeder } from "typeorm-extension";
import { DataSource } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { DataLookup } from '../../../src/entities/data-lookup.entity';

class CreateSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(DataLookup);

    const dataPath = path.join(__dirname, "data.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const data: any[] = JSON.parse(rawData);

    const lookups: DataLookup[] = [];

    for (const row of data) {
      lookups.push(
        repository.create({
          type: row.type,
          name: row.name,
          value: row.value,
          description: row.description,
          category: row.category,
          note: row.note,
          index: row.index,
          is_default: row.is_default,
          is_active: row.is_active,
          remark: row.remark,
        })
      );
    }

    await repository.upsert(lookups, {
      conflictPaths: ["value"],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}

export default CreateSeeder;
