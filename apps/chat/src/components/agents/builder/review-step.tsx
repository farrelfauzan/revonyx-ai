"use client";

import type { FormApi } from "@tanstack/react-form";
import type { AgentFormValues } from "./identity-step";

interface ReviewStepProps {
  form: FormApi<AgentFormValues, any>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const values = form.state.values;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review & Create</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{values.name}</span>
        </div>
        {values.avatar && (
          <div className="flex justify-between py-2 border-b items-center">
            <span className="text-muted-foreground">Avatar</span>
            {values.avatar.startsWith("http") ? (
              <img
                src={values.avatar}
                alt="avatar"
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <span className="text-xl">{values.avatar}</span>
            )}
          </div>
        )}
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium">{values.agentType}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Model</span>
          <span className="font-medium">{values.model}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Temperature</span>
          <span className="font-medium">{values.temperature}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Tools</span>
          <span className="font-medium">
            {values.tools.length} selected
          </span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-muted-foreground">Public</span>
          <span className="font-medium">
            {values.isPublic ? "Yes" : "No"}
          </span>
        </div>
        <div className="py-2">
          <span className="text-muted-foreground block mb-1">
            System Prompt
          </span>
          <p className="text-xs bg-muted/50 p-3 rounded-lg max-h-32 overflow-auto whitespace-pre-wrap">
            {values.systemPrompt}
          </p>
        </div>
      </div>
    </div>
  );
}
