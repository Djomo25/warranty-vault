import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('products/:id/invoices')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return this.invoicesService.upload(productId, req.user.id, file);
  }

  @Get('products/:id/invoices')
  findByProduct(@Param('id') productId: string, @Request() req: any) {
    return this.invoicesService.findByProduct(productId, req.user.id);
  }

  @Delete('invoices/:id')
  remove(@Param('id') invoiceId: string, @Request() req: any) {
    return this.invoicesService.remove(invoiceId, req.user.id);
  }
}
