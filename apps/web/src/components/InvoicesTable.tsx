import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import * as Types from '../types/index';

type Invoice = Types.Invoice;

interface InvoicesTableProps {
  invoices: Invoice[];
}

type SortField = 'vendor' | 'invoiceDate' | 'amount' | 'status';

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredAndSorted = useMemo(() => {
    let filtered = invoices.filter(inv =>
      inv.vendor.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by vendor or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
      <div className="overflow-auto max-h-96">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('vendor')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900"
                >
                  Vendor <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('invoiceDate')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900"
                >
                  Date <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Invoice #
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900 ml-auto"
                >
                  Amount <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase hover:text-gray-900"
                >
                  Status <ArrowUpDown size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSorted.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.vendor}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                  {invoice.currency} {invoice.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
