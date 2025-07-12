import { supabase } from '../utils/supabaseClient';

// Import subscription types
import type { 
  NGXTier, 
  SubscriptionInfo, 
  CoachingSession, 
  PremiumBonus,
  UsageMetrics 
} from '../types/subscription';

// Types
export interface ContactRead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  program_type?: 'PRIME' | 'LONGEVITY' | 'CUSTOM';
  source?: string;
  status?: 'active' | 'inactive' | 'archived';
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // NGX subscription fields
  subscription_tier?: NGXTier;
  subscription_status?: string;
  trial_end_date?: string;
  daily_queries_used?: number;
  program_week?: number;
  mrr?: number;
}

export interface ContactCreate {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  program_type?: 'PRIME' | 'LONGEVITY' | 'CUSTOM';
  source?: string;
  status?: 'active' | 'inactive' | 'archived';
  tags?: string[];
  custom_fields?: Record<string, any>;
  
  // NGX subscription fields
  subscription_tier?: NGXTier;
  subscription_status?: string;
  trial_end_date?: string;
}

export interface ContactUpdate extends Partial<ContactCreate> {}

export interface LeadRead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  program?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score?: number;
  assigned_to?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
  converted_to_contact_id?: string;
  converted_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  program?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score?: number;
  assigned_to?: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface LeadUpdate extends Partial<LeadCreate> {}

export interface DealRead {
  id: string;
  name: string;
  contact_id: string;
  lead_id?: string;
  deal_stage_id: string;
  value_amount?: number;
  expected_close_date?: string;
  probability?: number;
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  created_by?: string;
}

export interface DealCreate {
  name: string;
  contact_id: string;
  lead_id?: string;
  deal_stage_id: string;
  value_amount?: number;
  expected_close_date?: string;
  probability?: number;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface DealUpdate extends Partial<DealCreate> {}

export interface TaskRead {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: string;
  priority?: string;
  assigned_to_user_id?: string;
  related_lead_id?: string;
  related_contact_id?: string;
  related_deal_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  status?: string;
  priority?: string;
  assigned_to_user_id?: string;
  related_lead_id?: string;
  related_contact_id?: string;
  related_deal_id?: string;
  completed_at?: string;
  created_by_user_id?: string;
}

export interface TaskUpdate extends Partial<TaskCreate> {}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Auth Helper
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

// Generic API Helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Contacts API
export const contactsApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    program_type?: string;
  }): Promise<ContactRead[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.program_type) searchParams.set('program_type', params.program_type);
    
    const query = searchParams.toString();
    return apiRequest<ContactRead[]>(`/routes/api/v1/contacts${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<ContactRead> => {
    return apiRequest<ContactRead>(`/routes/api/v1/contacts/${id}`);
  },

  create: async (data: ContactCreate): Promise<ContactRead> => {
    return apiRequest<ContactRead>('/routes/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: ContactUpdate): Promise<ContactRead> => {
    return apiRequest<ContactRead>(`/routes/api/v1/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/routes/api/v1/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  getDeals: async (id: string): Promise<any[]> => {
    return apiRequest<any[]>(`/routes/api/v1/contacts/${id}/deals`);
  },

  getTasks: async (id: string): Promise<any[]> => {
    return apiRequest<any[]>(`/routes/api/v1/contacts/${id}/tasks`);
  },

  getInteractions: async (id: string): Promise<any[]> => {
    return apiRequest<any[]>(`/routes/api/v1/contacts/${id}/interactions`);
  },
};

// Leads API
export const leadsApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    assigned_to?: string;
    source?: string;
    search?: string;
  }): Promise<LeadRead[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assigned_to) searchParams.set('assigned_to', params.assigned_to);
    if (params?.source) searchParams.set('source', params.source);
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest<LeadRead[]>(`/routes/api/v1/leads${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<LeadRead> => {
    return apiRequest<LeadRead>(`/routes/api/v1/leads/${id}`);
  },

  create: async (data: LeadCreate): Promise<LeadRead> => {
    return apiRequest<LeadRead>('/routes/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: LeadUpdate): Promise<LeadRead> => {
    return apiRequest<LeadRead>(`/routes/api/v1/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/routes/api/v1/leads/${id}`, {
      method: 'DELETE',
    });
  },

  convert: async (id: string, createDeal: boolean = false): Promise<any> => {
    return apiRequest<any>(`/routes/api/v1/leads/${id}/convert?create_deal=${createDeal}`, {
      method: 'POST',
    });
  },

  getSources: async (): Promise<{ name: string }[]> => {
    return apiRequest<{ name: string }[]>('/routes/api/v1/leads/sources');
  },

  getStats: async (): Promise<any> => {
    return apiRequest<any>('/routes/api/v1/leads/stats');
  },
};

// Deals API
export const dealsApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    stage_id?: string;
    contact_id?: string;
    search?: string;
  }): Promise<DealRead[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.stage_id) searchParams.set('stage_id', params.stage_id);
    if (params?.contact_id) searchParams.set('contact_id', params.contact_id);
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest<DealRead[]>(`/routes/api/v1/deals${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<DealRead> => {
    return apiRequest<DealRead>(`/routes/api/v1/deals/${id}`);
  },

  create: async (data: DealCreate): Promise<DealRead> => {
    return apiRequest<DealRead>('/routes/api/v1/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: DealUpdate): Promise<DealRead> => {
    return apiRequest<DealRead>(`/routes/api/v1/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/routes/api/v1/deals/${id}`, {
      method: 'DELETE',
    });
  },

  moveToStage: async (id: string, stageId: string): Promise<DealRead> => {
    return apiRequest<DealRead>(`/routes/api/v1/deals/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ new_stage_id: stageId }),
    });
  },

  getStages: async (): Promise<any[]> => {
    return apiRequest<any[]>('/routes/api/v1/deals/stages');
  },
};

// Tasks API
export const tasksApi = {
  list: async (params?: {
    status?: string;
    assigned_to_user_id?: string;
    related_lead_id?: string;
    related_contact_id?: string;
    related_deal_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<TaskRead[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assigned_to_user_id) searchParams.set('assigned_to_user_id', params.assigned_to_user_id);
    if (params?.related_lead_id) searchParams.set('related_lead_id', params.related_lead_id);
    if (params?.related_contact_id) searchParams.set('related_contact_id', params.related_contact_id);
    if (params?.related_deal_id) searchParams.set('related_deal_id', params.related_deal_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest<TaskRead[]>(`/routes/api/v1/tasks${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<TaskRead> => {
    return apiRequest<TaskRead>(`/routes/api/v1/tasks/${id}`);
  },

  create: async (data: TaskCreate): Promise<TaskRead> => {
    return apiRequest<TaskRead>('/routes/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: TaskUpdate): Promise<TaskRead> => {
    return apiRequest<TaskRead>(`/routes/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/routes/api/v1/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

// Analytics API
export const analyticsApi = {
  getPipelineStats: async (rangeFilter?: string): Promise<any> => {
    const query = rangeFilter ? `?range_filter=${rangeFilter}` : '';
    return apiRequest<any>(`/routes/api/v1/analytics/pipeline${query}`);
  },
};

// Export all APIs
export const api = {
  contacts: contactsApi,
  leads: leadsApi,
  deals: dealsApi,
  tasks: tasksApi,
  analytics: analyticsApi,
};

export default api;