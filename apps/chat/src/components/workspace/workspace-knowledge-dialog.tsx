"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Eye, Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateWorkspaceKB,
  useAddWorkspaceChunks,
} from "@/hooks/use-workspace-knowledge";
import { toast } from "sonner";

interface WorkspaceKnowledgeDialogProps {
  channelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, skips creation step and goes straight to adding content */
  targetKbId?: string;
  targetKbName?: string;
}

type Step = "create" | "content";
type Tab = "write" | "preview";

export function WorkspaceKnowledgeDialog({
  channelId,
  open,
  onOpenChange,
  targetKbId,
  targetKbName,
}: WorkspaceKnowledgeDialogProps) {
  const [step, setStep] = useState<Step>(targetKbId ? "content" : "create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<Tab>("write");
  const [createdKbId, setCreatedKbId] = useState<string | null>(targetKbId ?? null);

  const createKB = useCreateWorkspaceKB();
  const addChunks = useAddWorkspaceChunks();

  const kbId = createdKbId ?? targetKbId;
  const displayName = targetKbName ?? name;

  const reset = () => {
    setStep(targetKbId ? "content" : "create");
    setName("");
    setDescription("");
    setContent("");
    setTab("write");
    setCreatedKbId(targetKbId ?? null);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createKB.mutate(
      { channelId, data: { name: name.trim(), description: description.trim() || undefined } },
      {
        onSuccess: (data: any) => {
          if (content.trim()) {
            // Create & Save: also add content immediately
            addChunks.mutate(
              { channelId, kbId: data.id, chunks: [{ content: content.trim() }] },
              {
                onSuccess: () => {
                  toast.success("Knowledge base created with content");
                  handleClose(false);
                },
                onError: () => {
                  toast.success("Knowledge base created, but failed to save content");
                  handleClose(false);
                },
              },
            );
          } else {
            setCreatedKbId(data.id);
            setStep("content");
            toast.success("Knowledge base created");
          }
        },
        onError: () => toast.error("Failed to create knowledge base"),
      },
    );
  };

  const handleSaveContent = () => {
    if (!content.trim() || !kbId) return;
    addChunks.mutate(
      { channelId, kbId, chunks: [{ content: content.trim() }] },
      {
        onSuccess: () => {
          toast.success("Knowledge saved");
          handleClose(false);
        },
        onError: () => toast.error("Failed to save knowledge"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            {step === "create" ? "Create Shared Knowledge" : `Add to "${displayName}"`}
          </DialogTitle>
        </DialogHeader>

        {step === "create" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Name</label>
              <Input
                placeholder="e.g. Product Guidelines, API Reference"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Description (optional)</label>
              <Input
                placeholder="Brief description of this knowledge base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Content (Markdown)</label>
              <MarkdownEditor content={content} onChange={setContent} tab={tab} onTabChange={setTab} />
            </div>
          </div>
        )}

        {step === "content" && (
          <div className="space-y-3 py-2 flex-1 min-h-0">
            <label className="text-xs font-medium text-zinc-400">
              Paste or write knowledge content in Markdown
            </label>
            <MarkdownEditor content={content} onChange={setContent} tab={tab} onTabChange={setTab} />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => handleClose(false)} className="text-zinc-400">
            Cancel
          </Button>
          {step === "create" ? (
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createKB.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createKB.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {content.trim() ? "Create & Save" : "Create"}
            </Button>
          ) : (
            <Button
              onClick={handleSaveContent}
              disabled={!content.trim() || addChunks.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {addChunks.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Knowledge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Markdown Editor with Preview ─────────────────────────────────────────────

function MarkdownEditor({
  content,
  onChange,
  tab,
  onTabChange,
}: {
  content: string;
  onChange: (val: string) => void;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-700 bg-zinc-850">
        <button
          type="button"
          onClick={() => onTabChange("write")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "write"
              ? "text-zinc-100 border-b-2 border-emerald-500 bg-zinc-800"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Pencil className="w-3 h-3" />
          Write
        </button>
        <button
          type="button"
          onClick={() => onTabChange("preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "preview"
              ? "text-zinc-100 border-b-2 border-emerald-500 bg-zinc-800"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
      </div>

      {/* Content area */}
      {tab === "write" ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="# Title&#10;&#10;Write your knowledge content here using Markdown...&#10;&#10;- Supports **bold**, *italic*, `code`&#10;- Lists, headings, links&#10;- Code blocks with syntax highlighting"
          className="w-full h-56 bg-zinc-900 text-zinc-200 text-sm p-3 resize-none focus:outline-none placeholder:text-zinc-600 font-mono"
        />
      ) : (
        <div className="w-full h-56 overflow-y-auto bg-zinc-900 p-3">
          {content.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-a:text-indigo-400 prose-strong:text-zinc-200 prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-800 prose-li:text-zinc-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
