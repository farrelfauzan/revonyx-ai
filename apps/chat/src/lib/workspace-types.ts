export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  status: "active" | "removed";
  joinedAt: string;
  user: { id: string; email: string };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceQuota {
  used: number;
  limit: number;
  tier: string;
  workspace: { id: string; name: string };
}

export interface ResolvedInvite {
  workspaceName: string;
  role: string;
  email: string;
  status: string;
  expiresAt: string;
}
