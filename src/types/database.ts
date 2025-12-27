export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';
export type TodoStatus = 'open' | 'done';
export type SuggestionCategory = 'activity' | 'food' | 'hotel' | 'transport' | 'other';
export type ActionType = 'create' | 'update' | 'delete' | 'reorder';
export type EntityType = 'route_item' | 'suggestion' | 'vote' | 'todo' | 'place' | 'user';

export interface User {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  created_by?: string;
}

export interface RouteItem {
  id: string;
  place_id: string;
  order_index: number;
  status: RouteStatus;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  place?: Place;
}

export interface Suggestion {
  id: string;
  place_id: string;
  title: string;
  description?: string;
  category: SuggestionCategory;
  link?: string;
  cost_estimate?: string;
  created_at: string;
  created_by?: string;
  creator?: User;
  votes?: Vote[];
  score?: number;
}

export interface Vote {
  id: string;
  suggestion_id: string;
  user_id: string;
  value: number;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  assignee_id?: string;
  status: TodoStatus;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  assignee?: User;
  creator?: User;
}

export interface AuditLog {
  id: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  actor_id?: string;
  created_at: string;
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  actor?: User;
}
