import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function toSnakeCase(dto: CreateProductDto | UpdateProductDto) {
  return {
    ...(dto.name !== undefined && { name: dto.name }),
    ...(dto.brand !== undefined && { brand: dto.brand }),
    ...(dto.model !== undefined && { model: dto.model }),
    ...(dto.serialNumber !== undefined && { serial_number: dto.serialNumber }),
    ...(dto.category !== undefined && { category: dto.category }),
    ...(dto.purchaseDate !== undefined && { purchase_date: dto.purchaseDate }),
    ...(dto.warrantyMonths !== undefined && { warranty_months: dto.warrantyMonths }),
    ...(dto.price !== undefined && { price: dto.price }),
    ...(dto.store !== undefined && { store: dto.store }),
    ...(dto.notes !== undefined && { notes: dto.notes }),
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Produit introuvable');
    if (data.user_id !== userId) throw new ForbiddenException();
    return data;
  }

  async create(dto: CreateProductDto, userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .insert({ ...toSnakeCase(dto), user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    await this.findOne(id, userId);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .update(toSnakeCase(dto))
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    const { error } = await this.supabase
      .getAdminClient()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { deleted: true };
  }
}
