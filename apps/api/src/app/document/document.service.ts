import { Injectable, BadRequestException } from "@nestjs/common";
import { S3Service } from "../knowledge/s3.service";
import { PdfConverter } from "./converters/pdf.converter";
import { DocxConverter } from "./converters/docx.converter";
import { XlsxConverter } from "./converters/xlsx.converter";
import { DocumentConverter } from "./converters/converter.interface";

export interface DocumentResult {
  format: string;
  url: string;
  filename: string;
  expiresAt: string;
}

export interface StoredDocumentReference {
  format: string;
  filename: string;
  key: string;
}

export interface StoredDocumentResult extends DocumentResult {
  key: string;
}

@Injectable()
export class DocumentService {
  private converters: Record<string, DocumentConverter>;

  constructor(
    private readonly s3: S3Service,
    private readonly pdfConverter: PdfConverter,
    private readonly docxConverter: DocxConverter,
    private readonly xlsxConverter: XlsxConverter,
  ) {
    this.converters = {
      pdf: this.pdfConverter,
      docx: this.docxConverter,
      xlsx: this.xlsxConverter,
    };
  }

  async generate(
    markdown: string,
    format: string,
    filename?: string,
  ): Promise<DocumentResult> {
    const generated = await this.generateWithStorage(
      markdown,
      format,
      filename,
    );
    const { key: _key, ...document } = generated;
    return document;
  }

  async generateWithStorage(
    markdown: string,
    format: string,
    filename?: string,
  ): Promise<StoredDocumentResult> {
    const converter = this.converters[format];
    if (!converter) {
      throw new BadRequestException(`Unsupported format: ${format}`);
    }

    const buffer = await converter.convert(markdown);
    const baseName = this.resolveBaseName(markdown, filename);
    const fullName = `${baseName}.${converter.extension}`;
    const key = `documents/${Date.now()}-${fullName}`;

    await this.s3.uploadWithDisposition(
      key,
      buffer,
      converter.mimeType,
      fullName,
    );

    const expiresIn = 3600;
    const url = await this.s3.getPresignedUrl(key, fullName, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return { format, url, filename: fullName, expiresAt, key };
  }

  async getDocumentFromStorage(
    reference: StoredDocumentReference,
    expiresIn = 3600,
  ): Promise<DocumentResult> {
    if (!this.converters[reference.format]) {
      throw new BadRequestException(`Unsupported format: ${reference.format}`);
    }

    const url = await this.s3.getPresignedUrl(
      reference.key,
      reference.filename,
      expiresIn,
    );
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      format: reference.format,
      filename: reference.filename,
      url,
      expiresAt,
    };
  }

  private resolveBaseName(markdown: string, filename?: string): string {
    const customName = filename
      ? this.sanitizeFilename(this.stripKnownExtension(filename))
      : "";

    if (customName) {
      return customName;
    }

    const inferred = this.inferNameFromMarkdown(markdown);
    if (inferred) {
      return inferred;
    }

    return `document-${Date.now()}`;
  }

  private inferNameFromMarkdown(markdown: string): string {
    const headingMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
    if (headingMatch?.[1]) {
      return this.sanitizeFilename(this.stripInlineMarkdown(headingMatch[1]));
    }

    const lines = markdown.split("\n");
    for (const line of lines) {
      const normalized = line.trim();
      if (!normalized) {
        continue;
      }

      // Skip table separators like |---|:---:|
      if (/^[\s|:-]+$/.test(normalized)) {
        continue;
      }

      // Prefer a readable line from table-style content.
      if (normalized.includes("|")) {
        const cells = normalized
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
          .map((cell) => this.stripInlineMarkdown(cell));
        const candidate = this.sanitizeFilename(cells.join(" "));
        if (candidate) {
          return candidate;
        }
      }

      const textCandidate = normalized
        .replace(/^>\s*/, "")
        .replace(/^[-*+]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^\[[ xX]\]\s+/, "");
      const candidate = this.sanitizeFilename(
        this.stripInlineMarkdown(textCandidate),
      );

      if (candidate) {
        return candidate;
      }
    }

    return "";
  }

  private stripKnownExtension(filename: string): string {
    return filename.replace(/\.(pdf|docx|xlsx)$/i, "");
  }

  private stripInlineMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/~~(.+?)~~/g, "$1");
  }

  private sanitizeFilename(input: string): string {
    return input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }
}
