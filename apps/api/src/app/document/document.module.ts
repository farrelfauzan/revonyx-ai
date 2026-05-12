import { Module } from "@nestjs/common";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { PdfConverter } from "./converters/pdf.converter";
import { DocxConverter } from "./converters/docx.converter";
import { XlsxConverter } from "./converters/xlsx.converter";

@Module({
  imports: [KnowledgeModule],
  controllers: [DocumentController],
  providers: [DocumentService, PdfConverter, DocxConverter, XlsxConverter],
  exports: [DocumentService],
})
export class DocumentModule {}
