"use client";

import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Bot,
  Plus,
  Server,
  Check,
  Upload,
  Smile,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useCreateChannel,
  useAddChannelAgent,
  useUploadChannelIcon,
} from "@/hooks/use-channels";
import { useAgents } from "@/hooks/use-agents";
import { toast } from "sonner";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const serverSchema = z.object({
  name: z.string().trim().min(1, "Server name is required"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type ServerFormValues = z.infer<typeof serverSchema>;

export function CreateServerDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createChannel = useCreateChannel();
  const addAgent = useAddChannelAgent();
  const uploadIcon = useUploadChannelIcon();
  const { data: agents } = useAgents();

  const form = useForm({
    defaultValues: {
      name: "",
      color: "#6366f1",
      icon: "",
    } as ServerFormValues,
    onSubmit: async ({ value }) => {
      const parsed = serverSchema.safeParse(value);
      if (!parsed.success) {
        const nextErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !nextErrors[key]) {
            nextErrors[key] = issue.message;
          }
        }
        setErrors(nextErrors);
        setActiveTab("general");
        return;
      }

      setErrors({});

      const iconValue = uploadedImage || parsed.data.icon;

      createChannel.mutate(
        {
          name: parsed.data.name,
          color: parsed.data.color,
          icon: iconValue,
        },
        {
          onSuccess: (channel) => {
            if (selectedAgentIds.length > 0) {
              const promises = selectedAgentIds.map((agentId) =>
                addAgent.mutateAsync({
                  channelId: channel.id,
                  agentId,
                }),
              );
              Promise.all(promises)
                .then(() => {
                  toast.success("Server created with agents!");
                })
                .catch(() => {
                  toast.success(
                    "Server created, but some agents failed to add",
                  );
                });
            } else {
              toast.success("Server created!");
            }
            handleClose();
          },
          onError: () => toast.error("Failed to create server"),
        },
      );
    },
  });

  const handleClose = () => {
    setOpen(false);
    setActiveTab("general");
    setSelectedAgentIds([]);
    setErrors({});
    setShowEmojiPicker(false);
    setUploadedImage(null);
    setImagePreview(null);
    form.reset();
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId],
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to S3
    uploadIcon.mutate(file, {
      onSuccess: (data) => {
        setUploadedImage(data.icon);
        toast.success("Icon uploaded!");
      },
      onError: () => {
        setImagePreview(null);
        toast.error("Failed to upload icon");
      },
    });
  };

  const handleEmojiSelect = (emoji: any) => {
    form.setFieldValue("icon", emoji.native);
    setShowEmojiPicker(false);
    // Clear uploaded image if emoji is selected
    setUploadedImage(null);
    setImagePreview(null);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const colorOptions = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="w-12 h-12 rounded-2xl bg-zinc-800 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:rounded-xl transition-all"
          title="Create Server"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-700 text-zinc-100 p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-zinc-100 text-lg">
            <Server className="w-5 h-5 text-indigo-400" />
            Create Server
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Set up a new server and configure its agents.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col"
        >
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="grid w-full grid-cols-2 bg-zinc-800/80 h-10 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={`h-8 rounded-md text-sm font-medium transition-all ${
                    activeTab === "general"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("agents")}
                  className={`h-8 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "agents"
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Agents
                  {selectedAgentIds.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 px-1.5 text-[10px] bg-indigo-600 text-white border-0"
                    >
                      {selectedAgentIds.length}
                    </Badge>
                  )}
                </button>
              </div>

              {/* ─── General Tab ─── */}
              <TabsContent value="general" className="mt-5 space-y-5">
                {/* Server Icon Section */}
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Server Icon
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Icon Preview */}
                    <form.Field name="color">
                      {(colorField) => (
                        <form.Field name="icon">
                          {(iconField) => (
                            <div className="relative group">
                              <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white overflow-hidden cursor-pointer border-2 border-zinc-700 hover:border-zinc-500 transition-colors"
                                style={{
                                  backgroundColor: imagePreview
                                    ? "transparent"
                                    : colorField.state.value || "#6366f1",
                                }}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                {imagePreview ? (
                                  <img
                                    src={imagePreview}
                                    alt="Server icon"
                                    className="w-full h-full object-cover"
                                  />
                                ) : iconField.state.value ? (
                                  <span className="text-2xl">
                                    {iconField.state.value}
                                  </span>
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-white/60" />
                                )}
                              </div>
                              {imagePreview && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={clearImage}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                              {uploadIcon.isPending && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                                </div>
                              )}
                            </div>
                          )}
                        </form.Field>
                      )}
                    </form.Field>

                    {/* Upload & Emoji Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        Choose Emoji
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowEmojiPicker(false)}
                      />
                      <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="dark"
                          previewPosition="none"
                          skinTonePosition="search"
                          maxFrequentRows={1}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Separator className="bg-zinc-800" />

                {/* Server Name */}
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Server Name
                      </label>
                      <Input
                        placeholder="e.g. Marketing Team"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          if (errors.name) {
                            setErrors((prev) => ({ ...prev, name: "" }));
                          }
                        }}
                        className="h-10 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-400">{errors.name}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Color Picker */}
                <form.Field name="color">
                  {(field) => (
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-zinc-300">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.handleChange(color)}
                            className={`w-8 h-8 rounded-full transition-all ${
                              field.state.value === color
                                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                                : "hover:scale-110 hover:ring-1 hover:ring-zinc-500"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </form.Field>

                <Separator className="bg-zinc-800" />

                {/* Preview */}
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Preview
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <form.Field name="name">
                      {(nameField) => (
                        <form.Field name="color">
                          {(colorField) => (
                            <form.Field name="icon">
                              {(iconField) => (
                                <div
                                  className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden"
                                  style={{
                                    backgroundColor: imagePreview
                                      ? "transparent"
                                      : colorField.state.value || "#6366f1",
                                  }}
                                >
                                  {imagePreview ? (
                                    <img
                                      src={imagePreview}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : iconField.state.value ? (
                                    <span className="text-lg">
                                      {iconField.state.value}
                                    </span>
                                  ) : nameField.state.value ? (
                                    nameField.state.value
                                      .charAt(0)
                                      .toUpperCase()
                                  ) : (
                                    "S"
                                  )}
                                </div>
                              )}
                            </form.Field>
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                    <form.Field name="name">
                      {(nameField) => (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">
                            {nameField.state.value || "Server Name"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {selectedAgentIds.length} agent
                            {selectedAgentIds.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
              </TabsContent>

              {/* ─── Agents Tab ─── */}
              <TabsContent value="agents" className="mt-5">
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Select agents to add to this server. You can add more later.
                  </p>

                  <ScrollArea className="h-64 rounded-lg border border-zinc-700 bg-zinc-800/30">
                    <div className="p-2">
                      {!agents || agents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                          <Bot className="w-10 h-10 mb-3 text-zinc-600" />
                          <p className="text-sm font-medium">
                            No agents available
                          </p>
                          <p className="text-xs text-zinc-600 mt-1">
                            Create agents first to add them here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {agents.map((agent: any) => {
                            const isSelected = selectedAgentIds.includes(
                              agent.id,
                            );
                            return (
                              <label
                                key={agent.id}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer overflow-hidden ${
                                  isSelected
                                    ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                                    : "hover:bg-zinc-700/40"
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleAgent(agent.id)}
                                  className="border-zinc-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{
                                    backgroundColor:
                                      agent.avatarColor || "#10b981",
                                  }}
                                >
                                  {agent.avatar ||
                                    agent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-200 truncate">
                                    {agent.name}
                                  </p>
                                  {agent.description && (
                                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                      {agent.description.length > 40
                                        ? agent.description.slice(0, 40) + "…"
                                        : agent.description}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {selectedAgentIds.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {selectedAgentIds.length} agent
                      {selectedAgentIds.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator className="bg-zinc-800 mt-6" />

          <DialogFooter className="px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createChannel.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5"
            >
              {createChannel.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Server"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
