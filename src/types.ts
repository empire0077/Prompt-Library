export interface User {
  id: string;
  employee_id: string | null;
  email: string;
  display_name: string;
  position: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null; // Lucide icon name
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  icon_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Prompt {
  id: string;
  owner_user_id: string;
  category_id: string | null;
  primary_tool_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  visibility: 'public' | 'private';
  status: string;
  language: string | null;
  current_version_id: string | null;
  usage_count: number;
  copy_count: number;
  favorite_count: number;
  rating_avg: string;
  rating_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  
  // Expanded fields added in queries
  owner_name?: string;
  owner_email?: string;
  category_name?: string;
  tool_name?: string;
  is_favorited?: boolean;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  change_note: string | null;
  created_by_user_id: string | null;
  status: string;
  created_at: string;
}

export interface PromptBlock {
  id: string;
  prompt_version_id: string;
  block_type: 'system' | 'user' | 'instruction';
  name: string | null;
  content: string;
  sort_order: number | null;
  is_required: boolean | null;
}

export interface PromptVariable {
  id: string;
  prompt_version_id: string;
  name: string;
  label: string | null;
  description: string | null;
  input_type: string | null;
  default_value: string | null;
  placeholder: string | null;
  is_required: boolean | null;
  validation_json: any | null;
  sort_order: number | null;
}

export interface UseTemplateOptions {
  variables: Record<string, string>;
  blocks: Record<string, string>;
}

export interface HydratedPrompt extends Prompt {
  blocks: PromptBlock[];
  variables: PromptVariable[];
  owner?: User;
  tags?: { id: string; name: string }[];
  primary_tool?: Tool;
}

export type DbTool = Tool;
