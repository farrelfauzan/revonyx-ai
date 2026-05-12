# PR Description

## Summary
This PR adds end-to-end document generation (PDF/DOCX/XLSX) in the API and improves chat UX/state handling in the chat app.

## What Changed

### 1. Dependency Updates
- Added backend document/export dependencies and related lockfile updates.
- Added chat-side dependency support for the new API client UX stack.

### 2. API: Document Generation + Persistence
- Added `DocumentModule` with converters for:
  - PDF (`pdfkit`)
  - DOCX (`docx`)
  - XLSX (`exceljs`)
- Added export endpoint and document service orchestration.
- Added S3 upload with content disposition + presigned URL generation.
- Integrated document generation into chat and portal completion flows.
- Added template-driven `output_format` support through prompt template tuning/classification.
- Persisted assistant document metadata on messages (`document_format`, `document_filename`, `document_key`).
- Rehydrated document URLs from storage when loading conversations.

### 3. Database + Seed
- Prisma schema updates for prompt-template output format and message document metadata.
- Added migrations:
  - `20260510145443_add_output_format_to_prompt_templates`
  - `20260512163000_add_document_fields_to_messages`
- Updated seed with document generation templates and keywords.

### 4. Chat App UX + State Fixes
- Added shared API client and config usage in portal hooks/pages.
- Added document card rendering in assistant bubbles.
- Added streaming status support for document generation.
- Improved streaming state handling when switching conversations:
  - Keep stream tied to origin conversation.
  - Prevent cross-chat commit of streamed output.
  - Preserve local conversation bubbles while streaming.
- Fixed active-chat deletion behavior:
  - Deleting the currently open conversation now clears to new chat state immediately.
  - Updated delete flow to `mutateAsync`.

## Commits
1. `chore(deps): add document export and chat client dependencies`
2. `feat(api): add document generation, storage, and persistence flow`
3. `feat(chat): improve portal UX for documents, streaming, and auth api client`

## Testing
- Built chat app successfully:
  - `bunx nx build chat --skip-nx-cache`
- Verified TypeScript diagnostics on modified files during implementation.

## Migration / Deployment Notes
1. Run Prisma migrations before deploy.
2. Ensure S3 env/config is set for document storage and presigned URL generation.
3. Re-run seed if document prompt templates are required in target environment.

## Risk Notes
- Main risk area is conversation state synchronization under fast tab/history switching; logic now guards stream ownership and prevents stale overwrite.
- Document generation quality depends on model output quality and prompt template coverage.
