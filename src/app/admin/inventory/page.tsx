'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Package, Plus, Search, Pencil, Trash2, ShoppingCart, DollarSign,
  AlertTriangle, TrendingUp, Tag, BarChart3, Truck, ArrowUpDown, X, Eye,
  RefreshCw, Minus, Loader2, ShoppingBag, BoxIcon, Clock, FileText,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: number; name: string; sku: string; description: string;
  category_id: number | null; cost_price: number; selling_price: number;
  quantity: number; unit: string;
  category: { id: number; name: string } | null;
}
interface Category { id: number; name: string; description: string; _count: { products: number } }
interface Sale {
  id: number; student_id: number | null; sale_date: string | null;
  total_amount: number; payment_method: string; status: string;
  sale_items: SaleItem[];
  student: { name: string; student_code: string } | null;
}
interface SaleItem { id: number; product_id: number; quantity: number; unit_price: number; subtotal: number; product?: { name: string } }
interface Supplier {
  supplier_id: number; name: string; contact_name: string; phone: string;
  email: string; address: string; is_active: number;
}
interface Movement {
  stock_movement_id: number; product_id: number | null; movement_type: string;
  quantity: number; previous_stock: number; new_stock: number;
  unit_cost: number; notes: string; movement_date: string | null;
}
interface Student { student_id: number; name: string; student_code: string; }

function fmt(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

function ContentSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({ totalValue: 0, lowStock: 0, totalSales: 0 });

  // Dialog states
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', sku: '', description: '', category_id: '', cost_price: '', selling_price: '', quantity: '', unit: 'pcs' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_name: '', phone: '', email: '', address: '' });
  const [stockForm, setStockForm] = useState({ product_id: '', quantity: '', unit_cost: '', notes: '', movement_type: 'restock' });

  // POS state
  const [cart, setCart] = useState<{ product_id: number; name: string; price: number; qty: number }[]>([]);
  const [posStudent, setPosStudent] = useState('');
  const [posPayment, setPosPayment] = useState('cash');
  const [saleProcessing, setSaleProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, stRes] = await Promise.all([
        fetch('/api/admin/inventory'),
        fetch('/api/students?limit=200'),
      ]);
      const data = await invRes.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setSales(data.sales || []);
      setSuppliers(data.suppliers || []);
      setMovements(data.movements || []);
      setStats(data.stats || { totalValue: 0, lowStock: 0, totalSales: 0 });
      const stData = await stRes.json();
      setStudents(Array.isArray(stData) ? stData : []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const filteredProducts = products.filter(p =>
    search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockItems = products.filter(p => p.quantity <= 5);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openProductForm = (p?: Product) => {
    setSelectedProduct(p || null);
    setProductForm(p
      ? { name: p.name, sku: p.sku, description: p.description, category_id: p.category_id?.toString() || '', cost_price: p.cost_price.toString(), selling_price: p.selling_price.toString(), quantity: p.quantity.toString(), unit: p.unit }
      : { name: '', sku: '', description: '', category_id: '', cost_price: '', selling_price: '', quantity: '', unit: 'pcs' }
    );
    setProductFormOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { toast.error('Product name is required'); return; }
    setSaving(true);
    try {
      const action = selectedProduct ? 'update_product' : 'create_product';
      const body = selectedProduct ? { action, id: selectedProduct.id, ...productForm } : { action, ...productForm };
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(selectedProduct ? 'Product updated successfully' : 'Product created successfully');
      setProductFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to save product'); }
    setSaving(false);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_product', id: selectedProduct.id }),
      });
      toast.success('Product deleted');
      setDeleteOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch { toast.error('Failed to delete product'); }
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_category', ...catForm }),
      });
      toast.success('Category created');
      setCatFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to create category'); }
    setSaving(false);
  };

  const openSupplierForm = (s?: Supplier) => {
    setSelectedSupplier(s || null);
    setSupplierForm(s
      ? { name: s.name, contact_name: s.contact_name, phone: s.phone, email: s.email, address: s.address }
      : { name: '', contact_name: '', phone: '', email: '', address: '' }
    );
    setSupplierFormOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const action = selectedSupplier ? 'update_supplier' : 'create_supplier';
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...supplierForm }),
      });
      toast.success(selectedSupplier ? 'Supplier updated' : 'Supplier created');
      setSupplierFormOpen(false);
      setSelectedSupplier(null);
      fetchData();
    } catch { toast.error('Failed to save supplier'); }
    setSaving(false);
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    try {
      await fetch(`/api/admin/inventory?action=supplier&id=${selectedSupplier.supplier_id}`, { method: 'DELETE' });
      toast.success('Supplier deleted');
      setDeleteOpen(false);
      setSelectedSupplier(null);
      fetchData();
    } catch { toast.error('Failed to delete supplier'); }
  };

  const handleStockMovement = async () => {
    if (!stockForm.product_id || !stockForm.quantity) { toast.error('Product and quantity are required'); return; }
    setSaving(true);
    try {
      const action = stockForm.movement_type === 'restock' ? 'add_stock' : 'adjust_stock';
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...stockForm }),
      });
      toast.success(`Stock ${stockForm.movement_type} completed`);
      setStockFormOpen(false);
      fetchData();
    } catch { toast.error('Failed to process stock movement'); }
    setSaving(false);
  };

  // ─── POS Handlers ──────────────────────────────────────────────────────────

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) { toast.error('Out of stock'); return; }
    const existing = cart.find(c => c.product_id === p.id);
    if (existing) {
      if (existing.qty >= p.quantity) { toast.error('Max stock reached'); return; }
      setCart(cart.map(c => c.product_id === p.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { product_id: p.id, name: p.name, price: p.selling_price, qty: 1 }]);
    }
  };

  const updateCartQty = (pid: number, qty: number) => {
    if (qty <= 0) setCart(cart.filter(c => c.product_id !== pid));
    else setCart(cart.map(c => c.product_id === pid ? { ...c, qty } : c));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaleProcessing(true);
    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_sale',
          student_id: posStudent || null,
          payment_method: posPayment,
          items: cart.map(c => ({ product_id: c.product_id, quantity: c.qty, unit_price: c.price })),
        }),
      });
      toast.success('Sale completed successfully');
      setCart([]);
      setPosStudent('');
      fetchData();
    } catch { toast.error('Failed to complete sale'); }
    setSaleProcessing(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Products, sales &amp; stock control</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openProductForm()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          ) : (
            <>
              <div className="group bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">{products.length}</p>
                    <p className="text-xs text-slate-500 mt-1.5">{categories.length} categories</p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">{stats.lowStock}</p>
                    <p className={`text-xs mt-1.5 ${stats.lowStock > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>{stats.lowStock > 0 ? 'Needs attention' : 'All stocked'}</p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col" style={{ borderLeft: '4px solid #0ea5e9' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Value</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">{fmt(stats.totalValue)}</p>
                    <p className="text-xs text-slate-500 mt-1.5">At cost price</p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-500">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 flex flex-col" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums leading-tight">{fmt(stats.totalSales)}</p>
                    <p className="text-xs text-slate-500 mt-1.5">{sales.length} transactions</p>
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-500">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="products" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 hidden sm:inline" /> Products
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <ShoppingCart className="w-4 h-4 mr-1 hidden sm:inline" /> POS
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" /> Sales
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <ArrowUpDown className="w-4 h-4 mr-1 hidden sm:inline" /> Stock
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Truck className="w-4 h-4 mr-1 hidden sm:inline" /> Suppliers
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm">
              <Tag className="w-4 h-4 mr-1 hidden sm:inline" /> Categories
            </TabsTrigger>
          </TabsList>

          {/* ═══ Products Tab ═══ */}
          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low stock (&le;5 units)</span>
              </div>
            )}

            {loading ? (
              <ContentSkeleton />
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No products found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {search ? 'Try a different search term' : 'Add your first product to get started'}
                    </p>
                  </div>
                  {!search && (
                    <Button onClick={() => openProductForm()} variant="outline" className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[44px]">
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hidden md:block">
                  {!loading && filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-medium text-slate-500">Showing {filteredProducts.length} of {products.length} products</p>
                    </div>
                  )}
                  <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Product</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">SKU</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Qty</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Price</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 w-28"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map(p => (
                            <TableRow key={p.id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.quantity <= 5 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                    <Package className={`w-4 h-4 ${p.quantity <= 5 ? 'text-red-600' : 'text-emerald-600'}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                                    {p.description && <p className="text-[10px] text-slate-400 truncate">{p.description}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 font-mono">{p.sku || '\u2014'}</TableCell>
                              <TableCell>
                                {p.category
                                  ? <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">{p.category.name}</Badge>
                                  : <span className="text-sm text-slate-400">{'\u2014'}</span>
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${p.quantity <= 5 ? 'text-red-600' : 'text-emerald-700'}`}>{p.quantity}</span>
                                <span className="text-slate-400 ml-1 text-xs">{p.unit}</span>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">{fmt(p.selling_price)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => addToCart(p)} title="Add to cart">
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openProductForm(p)} title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:bg-red-50" onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }} title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200/60 hover:shadow-sm transition-shadow p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${p.quantity <= 5 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            <Package className={`w-5 h-5 ${p.quantity <= 5 ? 'text-red-600' : 'text-emerald-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">{p.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{p.sku || 'No SKU'}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-[10px] border-slate-200">{p.category?.name || 'Uncategorized'}</Badge>
                              <Badge className={`text-[10px] ${p.quantity <= 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {p.quantity} {p.unit}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{fmt(p.selling_price)}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <Button size="sm" variant="outline" className="flex-1 min-h-[44px] text-xs" onClick={() => addToCart(p)}>
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
                          </Button>
                          <Button size="sm" variant="outline" className="min-h-[44px] min-w-[44px] p-0" onClick={() => openProductForm(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="min-h-[44px] min-w-[44px] text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>

                {search && (
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ POS Tab ═══ */}
          <TabsContent value="pos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Grid */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-900">Select Products</h3>
                      <Badge variant="outline" className="text-xs ml-auto border-slate-200">{products.filter(p => p.quantity > 0).length} in stock</Badge>
                    </div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 focus:bg-white" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                      {products.filter(p => p.quantity > 0 && (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))).map(p => {
                        const inCart = cart.some(c => c.product_id === p.id);
                        return (
                          <Card
                            key={p.id}
                            className={`cursor-pointer hover:shadow-sm transition-all ${inCart ? 'border-emerald-500 border-2 bg-emerald-50/30' : 'border-slate-200/60'}`}
                            onClick={() => addToCart(p)}
                          >
                            <CardContent className="p-3 text-center">
                              <Package className={`w-8 h-8 mx-auto mb-1.5 ${inCart ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-slate-500">{p.quantity} {p.unit}</p>
                              <p className="text-sm font-bold text-emerald-700 mt-1">{fmt(p.selling_price)}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <div>
                <Card className="border-slate-200/60 sticky top-20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Cart</h3>
                      </div>
                      <Badge variant="outline" className="text-xs border-slate-200">{cart.length} item{cart.length !== 1 ? 's' : ''}</Badge>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                      {cart.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Cart is empty</p>
                      ) : cart.map(c => (
                        <div key={c.product_id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-xs text-slate-500">{fmt(c.price)} &times; {c.qty}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 min-h-[28px]" onClick={() => updateCartQty(c.product_id, c.qty - 1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-7 text-center font-medium">{c.qty}</span>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 min-h-[28px]" onClick={() => updateCartQty(c.product_id, c.qty + 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="mb-4" />

                    <div className="space-y-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-emerald-700">{fmt(cartTotal)}</span>
                      </div>

                      <div className="space-y-2">
                        <Select value={posStudent} onValueChange={setPosStudent}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Student (optional)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48">
                            <SelectItem value="__none__">Walk-in</SelectItem>
                            {students.map(s => (
                              <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={posPayment} onValueChange={setPosPayment}>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]"
                          onClick={handleCheckout}
                          disabled={cart.length === 0 || saleProcessing}
                        >
                          {saleProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {saleProcessing ? 'Processing...' : 'Complete Sale'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══ Sales Tab ═══ */}
          <TabsContent value="sales">
            {loading ? (
              <Card className="border-slate-200/60"><CardContent className="p-0">{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}</CardContent></Card>
            ) : sales.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No sales yet</p>
                    <p className="text-sm text-slate-400 mt-1">Sales from the POS terminal will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <Card className="border-slate-200/60 hidden md:block">
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Items</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Amount</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Method</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.map(s => (
                            <TableRow key={s.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedSale(s)}>
                              <TableCell className="text-sm">{s.sale_date ? format(new Date(s.sale_date), 'MMM d, yyyy') : '\u2014'}</TableCell>
                              <TableCell className="text-sm font-medium">{s.student?.name || 'Walk-in'}</TableCell>
                              <TableCell className="text-xs text-slate-500">{s.sale_items?.length || 0} items</TableCell>
                              <TableCell className="text-right text-sm font-semibold">{fmt(s.total_amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">{s.payment_method.replace(/_/g, ' ')}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {s.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={e => { e.stopPropagation(); setSelectedSale(s); }}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {sales.map(s => (
                    <Card key={s.id} className="border-slate-200/60" onClick={() => setSelectedSale(s)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{s.student?.name || 'Walk-in'}</p>
                            <p className="text-xs text-slate-500">{s.sale_date ? format(new Date(s.sale_date), 'MMM d, yyyy HH:mm') : '\u2014'}</p>
                          </div>
                          <p className="text-base font-bold text-emerald-700">{fmt(s.total_amount)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{s.payment_method.replace(/_/g, ' ')}</Badge>
                          <Badge className={`text-[10px] ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.status}
                          </Badge>
                          <span className="text-xs text-slate-400 ml-auto">{s.sale_items?.length || 0} items</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 h-9 text-xs min-h-[36px]" onClick={e => { e.stopPropagation(); setSelectedSale(s); }}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Receipt
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <p className="text-xs text-slate-400 text-center mt-2">Showing {sales.length} sale(s)</p>
              </>
            )}
          </TabsContent>

          {/* ═══ Stock Movements Tab ═══ */}
          <TabsContent value="stock">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setStockForm({ product_id: '', quantity: '', unit_cost: '', notes: '', movement_type: 'restock' })} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" /> Stock Movement
              </Button>
            </div>

            {loading ? (
              <Card className="border-slate-200/60"><CardContent className="p-0">{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}</CardContent></Card>
            ) : movements.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ArrowUpDown className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No stock movements</p>
                    <p className="text-sm text-slate-400 mt-1">Record restocks and adjustments here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <Card className="border-slate-200/60 hidden md:block">
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Product</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Qty</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">Previous</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 text-right">New</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 hidden lg:table-cell">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map(m => (
                            <TableRow key={m.stock_movement_id}>
                              <TableCell className="text-xs">{m.movement_date ? format(new Date(m.movement_date), 'MMM d, HH:mm') : '\u2014'}</TableCell>
                              <TableCell className="text-sm">
                                {(() => { const prod = products.find(p => p.id === m.product_id); return prod?.name || `#${m.product_id || '\u2014'}`; })()}
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${m.movement_type === 'restock' ? 'bg-emerald-100 text-emerald-700' : m.movement_type === 'sale' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                                  {m.movement_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">{m.movement_type === 'sale' ? `-${m.quantity}` : `+${m.quantity}`}</TableCell>
                              <TableCell className="text-right text-sm text-slate-500">{m.previous_stock}</TableCell>
                              <TableCell className="text-right text-sm font-semibold">{m.new_stock}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-slate-500 max-w-32 truncate">{m.notes || '\u2014'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {movements.map(m => {
                    const prod = products.find(p => p.id === m.product_id);
                    return (
                      <Card key={m.stock_movement_id} className="border-slate-200/60">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{prod?.name || `Product #${m.product_id}`}</p>
                              <p className="text-xs text-slate-500">{m.movement_date ? format(new Date(m.movement_date), 'MMM d, HH:mm') : '\u2014'}</p>
                            </div>
                            <Badge className={`text-[10px] ${m.movement_type === 'restock' ? 'bg-emerald-100 text-emerald-700' : m.movement_type === 'sale' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                              {m.movement_type}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-slate-500">Qty</p>
                              <p className={`text-xs font-bold ${m.movement_type === 'sale' ? 'text-red-600' : 'text-emerald-700'}`}>
                                {m.movement_type === 'sale' ? `-${m.quantity}` : `+${m.quantity}`}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-slate-500">Before</p>
                              <p className="text-xs font-bold">{m.previous_stock}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-slate-500">After</p>
                              <p className="text-xs font-bold text-emerald-700">{m.new_stock}</p>
                            </div>
                          </div>
                          {m.notes && <p className="text-[10px] text-slate-400 mt-2 truncate">{m.notes}</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-400 text-center mt-2">Showing {movements.length} movement(s)</p>
              </>
            )}
          </TabsContent>

          {/* ═══ Suppliers Tab ═══ */}
          <TabsContent value="suppliers">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openSupplierForm()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : suppliers.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No suppliers yet</p>
                    <p className="text-sm text-slate-400 mt-1">Add your first supplier</p>
                  </div>
                  <Button onClick={() => openSupplierForm()} variant="outline" className="mt-2 min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" /> Add Supplier
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(sup => (
                  <Card key={sup.supplier_id} className="border-l-4 border-l-emerald-500 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{sup.name}</h3>
                        <Badge className={sup.is_active === 1 ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                          {sup.is_active === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {sup.contact_name && <p className="text-xs text-slate-500 mb-1">Contact: {sup.contact_name}</p>}
                      <p className="text-xs text-slate-500">{sup.phone || 'No phone'}{sup.email ? ` \u00b7 ${sup.email}` : ''}</p>
                      {sup.address && <p className="text-xs text-slate-400 mt-1">{sup.address}</p>}
                      <div className="flex gap-2 pt-2 mt-2 border-t border-slate-100">
                        <Button size="sm" variant="ghost" className="h-9 text-xs min-h-[36px]" onClick={() => openSupplierForm(sup)}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 text-xs text-red-600 hover:bg-red-50 min-h-[36px]" onClick={() => { setSelectedSupplier(sup); setDeleteOpen(true); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ Categories Tab ═══ */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setCatForm({ name: '', description: '' }); setCatFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : categories.length === 0 ? (
              <Card className="py-16 border-slate-200/60">
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Tag className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 font-medium">No categories yet</p>
                    <p className="text-sm text-slate-400 mt-1">Create your first category</p>
                  </div>
                  <Button onClick={() => { setCatForm({ name: '', description: '' }); setCatFormOpen(true); }} variant="outline" className="mt-2 min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <Card key={cat.id} className="border-slate-200/60 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-violet-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">{cat._count?.products || 0}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{cat.description || 'No description'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Product Form Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update product details below' : 'Fill in the details to add a new product'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Product Name <span className="text-red-500">*</span></Label>
              <Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Enter product name" className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">SKU</Label>
                <Input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} placeholder="SKU-001" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Unit</Label>
                <Select value={productForm.unit} onValueChange={v => setProductForm({ ...productForm, unit: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="kg">KG</SelectItem>
                    <SelectItem value="litre">Litre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={productForm.category_id} onValueChange={v => setProductForm({ ...productForm, category_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={2} placeholder="Brief description..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Cost Price</Label>
                <Input type="number" step="0.01" min="0" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Selling Price</Label>
                <Input type="number" step="0.01" min="0" value={productForm.selling_price} onChange={e => setProductForm({ ...productForm, selling_price: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Quantity</Label>
                <Input type="number" min="0" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} placeholder="0" className="min-h-[44px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProductFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveProduct} disabled={saving || !productForm.name.trim()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Tag className="w-4 h-4 text-violet-600" />
              </div>
              Add Category
            </DialogTitle>
            <DialogDescription>Create a new product category</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Name <span className="text-red-500">*</span></Label>
              <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category name" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCatFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={saving || !catForm.name.trim()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Form Dialog */}
      <Dialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Truck className="w-4 h-4 text-sky-600" />
              </div>
              {selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier ? 'Update supplier information' : 'Add a new supplier to your network'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Company Name <span className="text-red-500">*</span></Label>
              <Input value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="Company name" className="min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Contact Name</Label>
                <Input value={supplierForm.contact_name} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} placeholder="Contact person" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Phone</Label>
                <Input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+233..." className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Email</Label>
              <Input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="email@example.com" className="min-h-[44px]" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Address</Label>
              <Textarea value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} rows={2} placeholder="Business address..." />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSupplierFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleSaveSupplier} disabled={saving || !supplierForm.name.trim()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {selectedSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={stockFormOpen} onOpenChange={setStockFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-amber-600" />
              </div>
              Stock Movement
            </DialogTitle>
            <DialogDescription>Add stock or adjust inventory levels</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Movement Type <span className="text-red-500">*</span></Label>
              <Select value={stockForm.movement_type} onValueChange={v => setStockForm({ ...stockForm, movement_type: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (In)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Product <span className="text-red-500">*</span></Label>
              <Select value={stockForm.product_id} onValueChange={v => setStockForm({ ...stockForm, product_id: v })}>
                <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} (Stock: {p.quantity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Quantity <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="0" className="min-h-[44px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-medium">Unit Cost</Label>
                <Input type="number" step="0.01" min="0" value={stockForm.unit_cost} onChange={e => setStockForm({ ...stockForm, unit_cost: e.target.value })} placeholder="0.00" className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Notes</Label>
              <Input value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="e.g., Supplier delivery" className="min-h-[44px]" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setStockFormOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleStockMovement} disabled={saving || !stockForm.product_id || !stockForm.quantity} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {stockForm.movement_type === 'restock' ? 'Add Stock' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={open => { if (!open) setSelectedSale(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  Sale Receipt #{selectedSale.id}
                </DialogTitle>
                <DialogDescription>
                  {selectedSale.sale_date ? format(new Date(selectedSale.sale_date), 'MMMM d, yyyy HH:mm') : '\u2014'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{fmt(selectedSale.total_amount)}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{selectedSale.status}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{selectedSale.payment_method.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                {selectedSale.student && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                        {selectedSale.student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{selectedSale.student.name}</p>
                        <p className="text-xs text-slate-500">{selectedSale.student.student_code}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2">Items ({selectedSale.sale_items?.length || 0})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50"><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.sale_items?.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{item.product?.name || `#${item.product_id}`}</TableCell>
                          <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium text-sm">{fmt(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-2 font-bold text-sm"><span>Grand Total: {fmt(selectedSale.total_amount)}</span></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete {selectedProduct ? 'Product' : 'Supplier'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProduct ? `"${selectedProduct.name}"` : `"${selectedSupplier?.name}"`}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (selectedProduct) handleDeleteProduct(); else handleDeleteSupplier(); }} className="bg-red-600 hover:bg-red-700 min-h-[44px]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
