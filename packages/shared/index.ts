export interface DashboardStats {
  totalSpend: number;
  totalInvoices: number;
  documentsUploaded: number;
  avgInvoiceValue: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  status: 'pending' | 'paid' | 'overdue';
  category: string;
}

export interface ChartData {
  trendData: { month: string; count: number; value: number; }[];
  topVendors: { vendor: string; spend: number; }[];
  categoryBreakdown: { category: string; spend: number; }[];
  cashForecast: { month: string; amount: number; }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: any[];
}