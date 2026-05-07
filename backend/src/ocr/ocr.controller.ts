import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async scan(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier requis');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté (JPEG, PNG, WEBP ou PDF)');
    }
    return this.ocrService.extractFromBuffer(file.buffer, file.mimetype);
  }
}
