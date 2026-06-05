export interface DbUser {
  id: string | number;
  employee_id: string;
  email: string;
  display_name: string;
  position?: string;
  avatar_url?: string;
  role: string;
  status: string;
}

export interface DbCategory {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface DbTool {
  id: string | number;
  name: string;
  slug: string;
  category?: string;
  icon_url?: string;
  website_url?: string;
}

export interface DbTag {
  id: string | number;
  name: string;
  slug: string;
  color?: string;
}

export interface DbPromptBlock {
  id: string | number;
  block_type: 'system' | 'user' | 'instruction' | 'context' | 'example' | 'output_format' | 'constraint' | 'checklist' | string;
  name: string;
  content: string;
  sort_order: number;
  is_required: boolean;
}

export interface DbPromptVariable {
  id: string | number;
  name: string;
  label?: string;
  description?: string;
  input_type?: string;
  default_value?: string;
  placeholder?: string;
  is_required?: boolean;
}

export interface HydratedPrompt {
  id: string;
  title: string;
  description: string;
  visibility: 'private' | 'public';
  status: 'draft' | 'published' | 'archived';
  language: string;
  usage_count: number;
  copy_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  owner?: DbUser;
  category?: DbCategory;
  primary_tool?: DbTool;
  blocks: DbPromptBlock[];
  variables: DbPromptVariable[];
  tags: DbTag[];
  
  // UI states computed or tracked locally/session-wide
  is_favorite?: boolean;
}
