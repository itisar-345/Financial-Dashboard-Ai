import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import InvoicesTable from './InvoicesTable';
import * as Types from '../types/index';

type DashboardStats = Types.DashboardStats;
type Invoice = Types.Invoice;
type ChartData = Types.ChartData;
import { API_URL } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/stats`).then(r => r.json()),
      fetch(`${API_URL}/invoices`).then(r => r.json()),
      fetch(`${API_URL}/invoice-trends`).then(r => r.json()),
      fetch(`${API_URL}/vendors/top10`).then(r => r.json()),
      fetch(`${API_URL}/category-spend`).then(r => r.json()),
      fetch(`${API_URL}/cash-outflow`).then(r => r.json()),
    ]).then(([statsData, invoicesData, trendsData, vendorsData, categoryData, cashData]) => {

      const chartData = {
        trendData: trendsData,
        topVendors: vendorsData,
        categoryBreakdown: categoryData,
        cashForecast: cashData
      };
      setStats(statsData);
      setInvoices(invoicesData);
      setChartData(chartData);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Spend"
          value={`€ ${(stats?.totalSpend || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
          subtitle="+4.5% from last month"
          trend={4.5}
          isPositive={true}
        />
        <StatCard
          title="Total Invoices Processed"
          value={String(stats?.totalInvoices || 0)}
          subtitle="+25% from last month"
          trend={25}
          isPositive={true}
        />
        <StatCard
          title="Documents Uploaded"
          value={String(stats?.documentsUploaded || 0)}
          subtitle="-8 less from last month"
          trend={8}
          isPositive={false}
        />
        <StatCard
          title="Average Invoice Value"
          value={`€ ${(stats?.avgInvoiceValue || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
          subtitle="This Month"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Volume + Value Trend</h3>
            <p className="text-sm text-gray-500">Invoice count and total spend over 12 months</p>
          </div>
          <LineChart data={chartData?.trendData || []} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Spend by Vendor (Top 10)</h3>
            <p className="text-sm text-gray-500">Vendor spend with cumulative percentage distribution</p>
          </div>
          <BarChart data={chartData?.topVendors || []} horizontal={true} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Spend by Category</h3>
            <p className="text-sm text-gray-500">Distribution of spending across different categories</p>
          </div>
          <div className="flex justify-center">
            <PieChart data={chartData?.categoryBreakdown || []} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cash Outflow Forecast</h3>
            <p className="text-sm text-gray-500">Expected payment obligations grouped by due date</p>
          </div>
          <BarChart data={(chartData?.cashForecast || []).map(item => ({ ...item, spend: item.amount }))} horizontal={false} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoices by Vendor</h3>
            <p className="text-sm text-gray-500">Top vendors by invoice count and net value</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Vendor</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600"># Invoices</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData?.topVendors.slice(0, 5).map((vendor, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-xs text-gray-700 font-medium">{vendor.vendor}</td>
                    <td className="px-2 py-2 text-xs text-gray-600">19.08.2025</td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-gray-900">
                      € {vendor.spend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}
