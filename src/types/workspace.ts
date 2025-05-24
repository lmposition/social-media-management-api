export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  created_at: string;
}

export interface WorkspaceContext {
  workspace_id: string;
  user_id: string;
  role: string;
  permissions: string[];
}