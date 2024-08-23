import { PartialType } from '@nestjs/swagger';

export class CreateDataLookupDto {
  type?: string;
  name?: string;
  value?: string;
  category?: string;
  is_default?: boolean;
  description?: string;
  is_active?: boolean;
  remark?: string;
  index?: number;
}

export class UpdateDataLookupDto extends PartialType(CreateDataLookupDto) {}
