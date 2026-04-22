'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────
interface SaleItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface SaleData {
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

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Receipt Content ────────────────────────────────────
function ReceiptContent({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [sale, setSale] = useState<SaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReceipt = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/pos/receipt?saleId=${saleId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load receipt')
      }
      const data = await res.json()
      setSale(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    setLoading(false)
  }, [saleId])

  useEffect(() => { fetchReceipt() }, [fetchReceipt])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-500 text-sm">Loading receipt...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-700 font-medium mb-1">Receipt Not Found</p>
        <p className="text-slate-400 text-sm mb-6">{error || 'The requested receipt could not be loaded.'}</p>
        <Link href="/admin/inventory/pos">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to POS
          </Button>
        </Link>
      </div>
    )
  }

  const saleDate = sale.sale_date ? new Date(sale.sale_date) : new Date()

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Screen-only controls */}
      <div className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin/inventory/pos">
            <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <Button
            size="sm"
            className="gap-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-sm mx-auto px-4 py-6 print:py-0 print:px-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 print:shadow-none print:border-none print:rounded-none">
          <div className="p-6 print:p-4 space-y-4">
            {/* School Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SchoolManager</h1>
              <p className="text-xs text-slate-400">School Store &amp; Canteen</p>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt #</span>
                <span className="font-mono font-medium text-slate-700">{sale.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-slate-700">{format(saleDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time</span>
                <span className="text-slate-700">{format(saleDate, 'HH:mm:ss')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cashier</span>
                <span className="text-slate-700">{sale.cashier_name || 'Admin'}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer</span>
                  <span className="text-slate-700">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-300" />

            {/* Items Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {sale.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-1 text-sm py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div className="col-span-1 text-slate-400">{idx + 1}</div>
                  <div className="col-span-5 text-slate-700 truncate font-medium">{item.product_name}</div>
                  <div className="col-span-2 text-right text-slate-600">{item.quantity}</div>
                  <div className="col-span-2 text-right text-slate-500 font-mono text-xs">{fmt(item.unit_price).replace('GHS ', '')}</div>
                  <div className="col-span-2 text-right text-slate-700 font-medium font-mono text-xs">{fmt(item.subtotal).replace('GHS ', '')}</div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-300" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono text-slate-700">{fmt(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-mono text-red-500">-{fmt(sale.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">VAT (12.5%)</span>
                <span className="font-mono text-slate-700">{fmt(sale.vat_amount)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Grand Total</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{fmt(sale.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-300" />

            {/* Payment Details */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="text-slate-700 capitalize font-medium">
                  {sale.payment_method.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Tendered</span>
                <span className="font-mono text-slate-700">{fmt(sale.amount_tendered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Change</span>
                <span className="font-mono font-bold text-emerald-700">{fmt(sale.change_amount)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-300" />

            {/* Footer */}
            <div className="text-center space-y-2 pt-1">
              <p className="text-sm text-slate-600 font-medium">Thank you for your purchase!</p>
              <p className="text-xs text-slate-400">This receipt is computer generated.</p>
              <p className="text-xs text-slate-400">Powered by SchoolManager POS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page with Suspense boundary for useSearchParams ────
export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      }
    >
      <ReceiptPageInner />
    </Suspense>
  )
}

function ReceiptPageInner() {
  const searchParams = useSearchParams()
  const saleId = searchParams.get('saleId') || ''

  if (!saleId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <p className="text-slate-700 font-medium mb-1">No Sale ID Provided</p>
        <p className="text-slate-400 text-sm mb-6">Please provide a saleId parameter to view the receipt.</p>
        <Link href="/admin/inventory/pos">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to POS
          </Button>
        </Link>
      </div>
    )
  }

  return <ReceiptContent saleId={saleId} />
}
