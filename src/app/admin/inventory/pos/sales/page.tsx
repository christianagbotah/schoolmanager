'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ShoppingCart, Download, Search, Calendar, Filter,
  ChevronLeft, ChevronRight, DollarSign, TrendingUp,
  BarChart3, Receipt, CreditCard, Banknote, Smartphone,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────
interface SaleItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Sale {
  id: number
  receipt_number: string
  sale_date: string
  customer_type: string
  customer_name: string
  subtotal: number
  discount_amount: number
  vat_amount: number
  total_amount: number
  payment_method: string
  amount_tendered: number
  change_amount: number
  cashier_name: string
  status: string
  items: SaleItem[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Summaries {
  daily: { count: number; total: number; discount: number; vat: number }
  weekly: { count: number; total: number }
  monthly: { count: number; total: number }
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const paymentIcon = (method: string) => {
  switch (method) {
    case 'cash': return <Banknote className="w-3.5 h-3.5" />
    case 'mobile_money': return <Smartphone className="w-3.5 h-3.5" />
    case 'card': return <CreditCard className="w-3.5 h-3.5" />
    default: return <DollarSign className="w-3.5 h-3.5" />
  }
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Completed</Badge>
    case 'refunded':
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Refunded</Badge>
    case 'void':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Void</Badge>
    default:
      return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>
  }
}

export default function POSSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [summaries, setSummaries] = useState<Summaries | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [cashier, setCashier] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [receiptSearch, setReceiptSearch] = useState('')

  const fetchSales = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (cashier) params.set('cashier', cashier)
      if (paymentMethod && paymentMethod !== 'all') params.set('paymentMethod', paymentMethod)

      const res = await fetch(`/api/admin/inventory/pos/sales?${params}`)
      if (!res.ok) throw new Error('Failed to load sales history')
      const data = await res.json()

      setSales(data.sales || [])
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
      setSummaries(data.summaries || null)
    } catch {
      toast.error('Failed to load sales history')
    }
    setLoading(false)
  }, [startDate, endDate, cashier, paymentMethod])

  useEffect(() => { fetchSales(1) }, [fetchSales])

  // Apply filters
  const applyFilters = () => {
    fetchSales(1)
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setCashier('')
    setPaymentMethod('all')
    setReceiptSearch('')
  }

  // Pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    fetchSales(page)
  }

  // Filtered sales by receipt search (client-side)
  const displayedSales = receiptSearch.trim()
    ? sales.filter(s => s.receipt_number.toLowerCase().includes(receiptSearch.toLowerCase()))
    : sales

  // Export CSV
  const exportCSV = () => {
    if (displayedSales.length === 0) {
      toast.error('No sales data to export')
      return
    }

    const headers = ['Receipt #', 'Date/Time', 'Cashier', 'Items', 'Subtotal', 'Discount', 'VAT', 'Total', 'Payment', 'Status']
    const rows = displayedSales.map(s => [
      s.receipt_number,
      s.sale_date ? format(new Date(s.sale_date), 'yyyy-MM-dd HH:mm') : '',
      s.cashier_name,
      s.items?.length || 0,
      s.subtotal.toFixed(2),
      s.discount_amount.toFixed(2),
      s.vat_amount.toFixed(2),
      s.total_amount.toFixed(2),
      s.payment_method,
      s.status,
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pos-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">POS Sales History</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track all point-of-sale transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/inventory/pos">
              <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]">
                <ShoppingCart className="w-4 h-4" />
                POS Terminal
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 min-h-[44px]"
              onClick={exportCSV}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summaries && !loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Today&apos;s Sales</p>
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-emerald-700 mt-1">{summaries.daily.count}</p>
                <p className="text-xs text-slate-400 font-mono">{fmt(summaries.daily.total)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Total Revenue</p>
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                </div>
                <p className="text-xl font-bold text-violet-700 mt-1">{summaries.daily.count + summaries.weekly.count}</p>
                <p className="text-xs text-slate-400 font-mono">{fmt(summaries.monthly.total)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Weekly Revenue</p>
                  <DollarSign className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xl font-bold text-amber-700 mt-1">{summaries.weekly.count} sales</p>
                <p className="text-xs text-slate-400 font-mono">{fmt(summaries.weekly.total)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-sky-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Average Sale</p>
                  <Receipt className="w-4 h-4 text-sky-500" />
                </div>
                <p className="text-xl font-bold text-sky-700 mt-1">
                  {summaries.daily.count > 0 ? fmt(summaries.daily.total / summaries.daily.count).replace('GHS ', '') : 'GHS 0.00'}
                </p>
                <p className="text-xs text-slate-400">per transaction (today)</p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* From Date */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> From
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="min-h-[40px] text-sm"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> To
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="min-h-[40px] text-sm"
                />
              </div>

              {/* Cashier */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Cashier</label>
                <Input
                  placeholder="Filter by cashier..."
                  value={cashier}
                  onChange={e => setCashier(e.target.value)}
                  className="min-h-[40px] text-sm"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="min-h-[40px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply / Clear */}
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  className="flex-1 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-xs"
                  onClick={applyFilters}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] text-xs"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Receipt Search */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by receipt number..."
                value={receiptSearch}
                onChange={e => setReceiptSearch(e.target.value)}
                className="pl-10 min-h-[40px] text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Transactions
                {!loading && (
                  <Badge variant="secondary" className="text-xs ml-1">{pagination.total} total</Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : displayedSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-slate-600">No sales found</p>
                <p className="text-xs mt-1">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200">
                        <TableHead className="text-xs font-semibold">Receipt #</TableHead>
                        <TableHead className="text-xs font-semibold">Date/Time</TableHead>
                        <TableHead className="text-xs font-semibold hidden sm:table-cell">Cashier</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Items</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Subtotal</TableHead>
                        <TableHead className="text-xs font-semibold text-right hidden md:table-cell">Discount</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                        <TableHead className="text-xs font-semibold hidden lg:table-cell">Payment</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedSales.map(sale => (
                        <TableRow key={sale.id} className="border-slate-100 hover:bg-slate-50">
                          <TableCell>
                            <Link
                              href={`/admin/inventory/pos/receipt?saleId=${sale.id}`}
                              className="font-mono text-xs text-emerald-700 hover:underline font-medium"
                            >
                              {sale.receipt_number}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {sale.sale_date
                              ? format(new Date(sale.sale_date), 'MMM dd, HH:mm')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 hidden sm:table-cell">
                            {sale.cashier_name || 'Admin'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 text-center">
                            {sale.items?.length || 0}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 text-right font-mono">
                            {fmt(sale.subtotal)}
                          </TableCell>
                          <TableCell className="text-xs text-red-500 text-right font-mono hidden md:table-cell">
                            {sale.discount_amount > 0 ? `-${fmt(sale.discount_amount)}` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-800 text-right font-mono font-bold">
                            {fmt(sale.total_amount)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              {paymentIcon(sale.payment_method)}
                              <span className="capitalize">{sale.payment_method.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(sale.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={pagination.page <= 1}
                        onClick={() => goToPage(pagination.page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => goToPage(pagination.page + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
