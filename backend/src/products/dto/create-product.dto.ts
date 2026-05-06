import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsDateString()
  purchaseDate: string;

  @IsInt()
  @Min(1)
  warrantyMonths: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  store?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
