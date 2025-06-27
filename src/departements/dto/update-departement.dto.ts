// src/departements/dto/update-departement.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartementDto } from './create-departement.dto';

export class UpdateDepartementDto extends PartialType(CreateDepartementDto) {}