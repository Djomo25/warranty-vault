import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface OcrResult {
  rawText: string;
  name: string | null;
  purchaseDate: string | null;
  price: number | null;
  store: string | null;
}

@Injectable()
export class OcrService {
  private readonly apiKey = process.env.GOOGLE_VISION_API_KEY;

  async extractFromBuffer(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    const base64 = buffer.toString('base64');
    let rawText: string;

    try {
      if (mimeType === 'application/pdf') {
        rawText = await this.callFilesAnnotate(base64, mimeType);
      } else {
        rawText = await this.callImagesAnnotate(base64);
      }
    } catch (err: any) {
      throw new InternalServerErrorException(`Vision API error: ${err.message}`);
    }

    return { rawText, ...this.parseText(rawText) };
  }

  private async callImagesAnnotate(base64: string): Promise<string> {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;
    const body = {
      requests: [{
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: ['fr', 'en'] },
      }],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    return data?.responses?.[0]?.fullTextAnnotation?.text ?? '';
  }

  private async callFilesAnnotate(base64: string, mimeType: string): Promise<string> {
    const url = `https://vision.googleapis.com/v1/files:annotate?key=${this.apiKey}`;
    const body = {
      requests: [{
        inputConfig: { content: base64, mimeType },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        pages: [1],
      }],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const pages: any[] = data?.responses?.[0]?.responses ?? [];
    return pages.map((p: any) => p?.fullTextAnnotation?.text ?? '').join('\n');
  }

  private parseText(text: string): Omit<OcrResult, 'rawText'> {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    return {
      purchaseDate: this.extractDate(text),
      price: this.extractPrice(text),
      store: this.extractStore(lines),
      name: this.extractProductName(lines),
    };
  }

  private extractDate(text: string): string | null {
    const m1 = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
    if (m1) {
      const [, d, mo, y] = m1;
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const m2 = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m2) return m2[0];
    const MONTHS: Record<string, string> = {
      janvier: '01', février: '02', mars: '03', avril: '04',
      mai: '05', juin: '06', juillet: '07', août: '08',
      septembre: '09', octobre: '10', novembre: '11', décembre: '12',
    };
    const m3 = text.match(
      /\b(\d{1,2})\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+(\d{4})\b/i,
    );
    if (m3) {
      const [, d, mon, y] = m3;
      const key = mon.toLowerCase().replace('é', 'é').replace('û', 'û');
      const mo = MONTHS[key] ?? '01';
      return `${y}-${mo}-${d.padStart(2, '0')}`;
    }
    return null;
  }

  private extractPrice(text: string): number | null {
    const patterns = [
      /total\s*[:\s]+(\d+[,\.]\d{2})\s*€?/i,
      /(\d+[,\.]\d{2})\s*€/,
      /€\s*(\d+[,\.]\d{2})/,
      /(\d+[,\.]\d{2})\s*eur/i,
    ];
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return parseFloat(m[1].replace(',', '.'));
    }
    return null;
  }

  private readonly KNOWN_STORES = [
    'fnac', 'darty', 'amazon', 'ldlc', 'boulanger', 'leroy merlin',
    'ikea', 'carrefour', 'auchan', 'leclerc', 'media markt',
    'apple store', 'cdiscount', 'rue du commerce', 'but',
  ];

  private extractStore(lines: string[]): string | null {
    const full = lines.join(' ').toLowerCase();
    for (const store of this.KNOWN_STORES) {
      if (full.includes(store)) {
        return store.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return lines[0] ?? null;
  }

  private extractProductName(lines: string[]): string | null {
    const skip = [/total/i, /tva/i, /\bttc\b/i, /\bht\b/i, /siret/i, /tel:/i, /adresse/i, /facture/i, /ticket/i];
    for (let i = 1; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (line.length < 5 || line.length > 100) continue;
      if (/\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(line)) continue;
      if (/^\d+[,\.]\d{2}/.test(line)) continue;
      if (skip.some((p) => p.test(line))) continue;
      return line;
    }
    return null;
  }
}
