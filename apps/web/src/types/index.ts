export interface DashboardStats {
  totalSpend: number;
  totalInvoices: number;
  documentsUploaded: number;
  avgInvoiceValue: number;
  spendChange: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  category: string;
}

export interface TrendData {
  month: string;
  count: number;
  value: number;
}

export interface VendorSpend {
  vendor: string;
  spend: number;
}

export interface CategorySpend {
  category: string;
  spend: number;
}

export interface CashForecast {
  month: string;
  amount: number;
}

export interface ChartData {
  trendData: TrendData[];
  topVendors: VendorSpend[];
  categoryBreakdown: CategorySpend[];
  cashForecast: CashForecast[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: any[];
}
