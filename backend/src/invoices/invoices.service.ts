import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'invoices';
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const SIGNED_URL_TTL = 3600; // 1 heure

@Injectable()
export class InvoicesService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(productId: string, userId: string, file: Express.Multer.File) {
    await this.assertProductOwner(productId, userId);

    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté (PDF, JPEG, PNG, WEBP uniquement)');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo)');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `${userId}/${productId}/${safeName}`;

    const { error: storageErr } = await this.supabase
      .getAdminClient()
      .storage.from(BUCKET)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (storageErr) throw new Error(storageErr.message);

    const { data, error: dbErr } = await this.supabase
      .getAdminClient()
      .from('invoices')
      .insert({
        product_id: productId,
        user_id: userId,
        file_name: file.originalname,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.mimetype,
      })
      .select()
      .single();

    if (dbErr) {
      // Nettoyer le fichier en storage si l'insertion en base échoue
      await this.supabase.getAdminClient().storage.from(BUCKET).remove([filePath]);
      throw new Error(dbErr.message);
    }

    return { ...data, url: await this.signedUrl(filePath) };
  }

  async findByProduct(productId: string, userId: string) {
    await this.assertProductOwner(productId, userId);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('invoices')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return Promise.all(
      data.map(async (inv) => ({ ...inv, url: await this.signedUrl(inv.file_path) })),
    );
  }

  async remove(invoiceId: string, userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !data) throw new NotFoundException('Facture introuvable');
    if (data.user_id !== userId) throw new ForbiddenException();

    await this.supabase.getAdminClient().storage.from(BUCKET).remove([data.file_path]);
    await this.supabase.getAdminClient().from('invoices').delete().eq('id', invoiceId);

    return { deleted: true };
  }

  private async signedUrl(filePath: string): Promise<string> {
    const { data } = await this.supabase
      .getAdminClient()
      .storage.from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL);
    return data?.signedUrl ?? '';
  }

  private async assertProductOwner(productId: string, userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (error || !data) throw new NotFoundException('Produit introuvable');
    if (data.user_id !== userId) throw new ForbiddenException();
  }
}
