export interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  multiline?: boolean;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  fields: IntegrationField[];
  scopes: string[];
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: "jira",
    name: "Jira",
    description: "Track issues and manage projects",
    logoUrl: "https://cdn.simpleicons.org/jira",
    fields: [
      {
        key: "baseUrl",
        label: "Base URL",
        placeholder: "https://your-domain.atlassian.net",
      },
      { key: "email", label: "Email", placeholder: "you@company.com" },
      {
        key: "apiToken",
        label: "API Token",
        placeholder: "Your Jira API token",
        secret: true,
      },
      { key: "projectKey", label: "Project Key", placeholder: "PROJ" },
    ],
    scopes: ["read:jira-work", "write:jira-work"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Access pages and databases",
    logoUrl: "https://cdn.simpleicons.org/notion",
    fields: [
      {
        key: "integrationToken",
        label: "Integration Token",
        placeholder: "secret_...",
        secret: true,
      },
      {
        key: "workspaceId",
        label: "Workspace ID",
        placeholder: "Your workspace ID",
      },
    ],
    scopes: ["read", "write"],
  },
  {
    id: "plane",
    name: "Plane",
    description: "Open-source project management",
    logoUrl: "https://cdn.simpleicons.org/plane",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Your Plane API key",
        secret: true,
      },
      {
        key: "workspaceSlug",
        label: "Workspace Slug",
        placeholder: "my-workspace",
      },
      { key: "projectId", label: "Project ID", placeholder: "Project UUID" },
    ],
    scopes: ["read", "write"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send and receive messages",
    logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
    fields: [
      {
        key: "botToken",
        label: "Bot Token",
        placeholder: "xoxb-...",
        secret: true,
      },
      {
        key: "channelId",
        label: "Channel ID",
        placeholder: "C01234567",
      },
    ],
    scopes: ["chat:write", "channels:read"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Manage repos, issues, and PRs",
    logoUrl: "https://cdn.simpleicons.org/github",
    fields: [
      {
        key: "personalAccessToken",
        label: "Personal Access Token",
        placeholder: "ghp_...",
        secret: true,
      },
      { key: "owner", label: "Owner", placeholder: "username or org" },
      { key: "repo", label: "Repository", placeholder: "repo-name" },
    ],
    scopes: ["repo", "read:org"],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Manage events and schedules",
    logoUrl: "https://cdn.simpleicons.org/googlecalendar",
    fields: [
      {
        key: "serviceAccountJson",
        label: "Service Account JSON",
        placeholder: "Paste service account JSON",
        secret: true,
        multiline: true,
      },
    ],
    scopes: ["calendar.events", "calendar.readonly"],
  },
];
