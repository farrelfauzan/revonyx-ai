"use client";

import type { DocumentAttachment } from "@/lib/api";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

const FORMAT_CONFIG: Record<
  string,
  { icon: typeof FileText; label: string; bg: string; border: string }
> = {
  pdf: {
    icon: FileText,
    label: "PDF",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  docx: {
    icon: FileText,
    label: "Word",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  xlsx: {
    icon: FileSpreadsheet,
    label: "Excel",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
};

export function DocumentCard({ document }: { document: DocumentAttachment }) {
  const config = FORMAT_CONFIG[document.format] ?? FORMAT_CONFIG.pdf;
  const Icon = config.icon;

  return (
    <motion.a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 rounded-xl border ${config.border} ${config.bg} px-4 py-3 mt-3 hover:brightness-110 transition-all cursor-pointer group max-w-sm`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">
          {document.filename}
        </p>
        <p className="text-xs text-white/50">{config.label} document</p>
      </div>
      <FileDown className="h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors shrink-0" />
    </motion.a>
  );
}
