'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote,
  Smartphone, Printer, Package, AlertTriangle, CheckCircle, XCircle,
  BarChart3, DollarSign, User, X, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────
interface Product {
  id: number; name: string; sku: string; description: string;
  category_id: number | null; cost_price: number; selling_price: number;
  quantity: number; unit: string;
  category: { id: number; name: string } | null;
}
interface Category { id: number; name: string; description: string; is_active: number }
interface CartItem {
  product_id: number; name: string; price: number; qty: number; maxStock: number;
}
interface RecentSale {
  id: number; receipt_number: string; sale_date: string;
  customer_name: string; customer_type: string; total_amount: number;
  payment_method: string; items: { id: number; product_name: string; quantity: number }[];
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const VAT_RATE = 0.125

export default function POSPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Sale options
  const [customerType, setCustomerType] = useState('guest')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discountInput, setDiscountInput] = useState('')
  const [amountTendered, setAmountTendered] = useState('')
  const [processing, setProcessing] = useState(false)

  // Students/Staff list for search
  const [students, setStudents] = useState<{ student_id: number; name: string; student_code: string }[]>([])
  const [staffList, setStaffList] = useState<{ teacher_id: number; name: string; teacher_code: string }[]>([])

  // ── Fetch data ───────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [posRes, stRes, tRes] = await Promise.all([
        fetch('/api/admin/inventory/pos'),
        fetch('/api/students?limit=300'),
        fetch('/api/teachers?limit=200'),
      ])
      const posData = await posRes.json()
      setProducts(posData.products || [])
      setCategories(posData.categories || [])
      setRecentSales(posData.recentSales || [])

      const stData = await stRes.json()
      setStudents(Array.isArray(stData) ? stData : stData?.students || [])
      const tData = await tRes.json()
      setStaffList(Array.isArray(tData) ? tData : tData?.teachers || [])
    } catch {
      toast({ title: 'Error loading POS data', variant: 'destructive' })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Computed values ──────────────────────────────
  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart])
  const discount = parseFloat(discountInput) || 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const vat = Math.round(afterDiscount * VAT_RATE * 100) / 100
  const total = Math.round((afterDiscount + vat) * 100) / 100
  const tendered = parseFloat(amountTendered) || 0
  const change = Math.round(Math.max(0, tendered - total) * 100) / 100
  const cartItemCount = cart.reduce((s, c) => s + c.qty, 0)

  // ── Filtered products ────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = products
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category_id?.toString() === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
    }
    return result
  }, [products, activeCategory, searchQuery])

  // Customer search results
  const customerOptions = useMemo(() => {
    if (customerType === 'student') return students
    if (customerType === 'staff') return staffList
    return []
  }, [customerType, students, staffList])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customerOptions.slice(0, 10)
    const q = customerSearch.toLowerCase()
    return customerOptions.filter(c => c.name.toLowerCase().includes(q))
  }, [customerSearch, customerOptions])

  // ── Cart actions ─────────────────────────────────
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast({ title: 'Out of Stock', description: `${product.name} is not available`, variant: 'destructive' })
      return
    }
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id)
      if (existing) {
        if (existing.qty >= product.quantity) {
          toast({ title: 'Max stock reached', variant: 'destructive' })
          return prev
        }
        return prev.map(c => c.product_id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.selling_price,
        qty: 1,
        maxStock: product.quantity,
      }]
    })
  }

  const updateQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(c => c.product_id !== productId))
      return
    }
    setCart(prev => prev.map(c => {
      if (c.product_id === productId) {
        return { ...c, qty: Math.min(newQty, c.maxStock) }
      }
      return c
    }))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.product_id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setDiscountInput('')
    setAmountTendered('')
    setSelectedCustomerId('')
    setSelectedCustomerName('')
    setCustomerSearch('')
  }

  // ── Complete sale ────────────────────────────────
  const completeSale = async () => {
    if (cart.length === 0) return
    if (tendered < total && paymentMethod === 'cash') {
      toast({ title: 'Insufficient amount', description: 'Amount tendered is less than total', variant: 'destructive' })
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/inventory/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({
            product_id: c.product_id,
            quantity: c.qty,
            unit_price: c.price,
          })),
          customer_type: customerType,
          customer_id: selectedCustomerId || null,
          customer_name: selectedCustomerName || '',
          payment_method: paymentMethod,
          discount_amount: discount,
          amount_tendered: tendered || total,
          cashier_name: 'Admin',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Sale failed')
      }

      const sale = await res.json()
      toast({
        title: 'Sale Completed!',
        description: `Receipt #${sale.receipt_number}`,
      })
      clearCart()
      fetchData()
      // Navigate to receipt
      router.push(`/admin/inventory/pos/receipt?saleId=${sale.id}`)
    } catch (err) {
      toast({
        title: 'Sale Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    }
    setProcessing(false)
  }

  // ── Stock badge color ────────────────────────────
  const stockBadge = (qty: number) => {
    if (qty <= 0) return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
    if (qty < 5) return <Badge className="bg-red-100 text-red-700 text-xs">Low: {qty}</Badge>
    if (qty <= 10) return <Badge className="bg-amber-100 text-amber-700 text-xs">Med: {qty}</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{qty} in stock</Badge>
  }

  const paymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-3 h-3" />
      case 'mobile_money': return <Smartphone className="w-3 h-3" />
      case 'card': return <CreditCard className="w-3 h-3" />
      default: return <DollarSign className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/20" />
            <Skeleton className="h-6 w-40 rounded bg-white/20" />
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4"><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-[600px] rounded-xl" /></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Point of Sale</h1>
                <p className="text-emerald-200 text-xs hidden sm:block">School Store & Canteen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/inventory/pos/sales">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1.5 min-h-[44px]">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sales History</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* ── Left Panel: Product Catalog ─────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 min-h-[44px] bg-white"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Button
                size="sm"
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className={`min-h-[36px] shrink-0 text-xs ${activeCategory === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeCategory === cat.id.toString() ? 'default' : 'outline'}
                  className={`min-h-[36px] shrink-0 text-xs ${activeCategory === cat.id.toString() ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={() => setActiveCategory(cat.id.toString())}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Product Grid */}
            <Card className="border-slate-200/60">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-1">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No products found</p>
                      <p className="text-xs mt-1">Try a different search or category</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => {
                      const inCart = cart.find(c => c.product_id === product.id)
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={`relative p-3 rounded-lg border text-left transition-all hover:shadow-md active:scale-[0.98] ${
                            inCart
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          {/* Product image placeholder */}
                          <div className="w-full aspect-square rounded-md bg-slate-100 flex items-center justify-center mb-2">
                            <Package className={`w-8 h-8 ${inCart ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>
                          <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{product.sku || product.unit}</p>
                          <p className="text-sm font-bold text-emerald-700 mt-1">{fmt(product.selling_price)}</p>
                          <div className="mt-1">{stockBadge(product.quantity)}</div>
                          {inCart && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {inCart.qty}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            {recentSales.length > 0 && (
              <Card className="border-slate-200/60">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recentSales.map(sale => (
                      <Link
                        key={sale.id}
                        href={`/admin/inventory/pos/receipt?saleId=${sale.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {sale.customer_name || sale.customer_type}
                            </p>
                            <p className="text-xs text-slate-400">
                              {sale.sale_date ? format(new Date(sale.sale_date), 'HH:mm') : ''} · {sale.items?.length || 0} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-700">{fmt(sale.total_amount)}</p>
                          <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
                            {paymentIcon(sale.payment_method)}
                            <span className="capitalize">{sale.payment_method?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right Panel: Cart ───────────────────── */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200/60 sticky top-20">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Current Sale
                    {cartItemCount > 0 && (
                      <Badge className="bg-emerald-600 text-white ml-1">{cartItemCount}</Badge>
                    )}
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Cart Items */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Cart is empty</p>
                      <p className="text-xs mt-1">Click products to add them</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product_id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">{fmt(item.price)} × {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQty(item.product_id, item.qty - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQty(item.product_id, item.qty + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold text-slate-800 w-16 text-right shrink-0">
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Customer Section */}
                <div className="space-y-2">
                  <Select value={customerType} onValueChange={v => { setCustomerType(v); setSelectedCustomerId(''); setSelectedCustomerName(''); setCustomerSearch(''); }}>
                    <SelectTrigger className="min-h-[40px]">
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>

                  {customerType !== 'guest' && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        placeholder={`Search ${customerType}...`}
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-9 min-h-[40px] text-sm"
                      />
                      {customerSearch && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredCustomers.slice(0, 8).map(c => {
                            const id = customerType === 'student' ? c.student_id : c.teacher_id
                            return (
                              <button
                                key={id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => {
                                  setSelectedCustomerId(id.toString())
                                  setSelectedCustomerName(c.name)
                                  setCustomerSearch(c.name)
                                }}
                              >
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-slate-400 ml-auto">
                                  {customerType === 'student' ? c.student_code : c.teacher_code}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {selectedCustomerName && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle className="w-3 h-3" />
                          {selectedCustomerName}
                          <button onClick={() => { setSelectedCustomerId(''); setSelectedCustomerName(''); setCustomerSearch(''); }} className="ml-auto text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: Banknote },
                      { value: 'mobile_money', label: 'MoMo', icon: Smartphone },
                      { value: 'card', label: 'Card', icon: CreditCard },
                    ].map(pm => (
                      <Button
                        key={pm.value}
                        variant={paymentMethod === pm.value ? 'default' : 'outline'}
                        size="sm"
                        className={`min-h-[44px] text-xs gap-1.5 ${paymentMethod === pm.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setPaymentMethod(pm.value)}
                      >
                        <pm.icon className="w-3.5 h-3.5" />
                        {pm.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-500">Discount</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value)}
                      className="w-28 h-8 text-right text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">VAT (12.5%)</span>
                    <span className="font-medium">{fmt(vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-emerald-700">{fmt(total)}</span>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-slate-500">Amount Tendered</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={amountTendered}
                        onChange={e => setAmountTendered(e.target.value)}
                        className="w-28 h-8 text-right text-sm"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Change</span>
                      <span className={`font-bold ${tendered >= total ? 'text-emerald-700' : 'text-red-500'}`}>
                        {tendered > 0 ? fmt(change) : 'GHS 0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Complete Sale Button */}
                <Button
                  className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-base font-bold gap-2"
                  onClick={completeSale}
                  disabled={cart.length === 0 || processing}
                >
                  {processing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {processing ? 'Processing...' : `Complete Sale · ${fmt(total)}`}
                </Button>

                {paymentMethod !== 'cash' && cart.length > 0 && (
                  <p className="text-xs text-center text-slate-400">
                    Confirm payment via {paymentMethod.replace('_', ' ')} before completing
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
