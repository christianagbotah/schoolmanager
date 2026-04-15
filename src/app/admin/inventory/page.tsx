"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, Search, Pencil, Trash2, ShoppingCart, DollarSign,
  AlertTriangle, TrendingUp, Tag, BarChart3, Truck, ArrowUpDown, X, Eye,
  RefreshCw, Minus, ShoppingCart as ShoppingCartIcon, Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Product { id: number; name: string; sku: string; description: string; category_id: number | null; cost_price: number; selling_price: number; quantity: number; unit: string; category: { id: number; name: string } | null; }
interface Category { id: number; name: string; description: string; _count: { products: number } }
interface Sale { id: number; student_id: number | null; sale_date: string | null; total_amount: number; payment_method: string; status: string; sale_items: SaleItem[]; student: { name: string; student_code: string } | null; }
interface SaleItem { id: number; product_id: number; quantity: number; unit_price: number; subtotal: number; product?: { name: string } }
interface Supplier { supplier_id: number; name: string; contact_name: string; phone: string; email: string; address: string; is_active: number; }
interface Movement { stock_movement_id: number; product_id: number | null; movement_type: string; quantity: number; previous_stock: number; new_stock: number; unit_cost: number; notes: string; movement_date: string | null; performed_by: string; }
interface Student { student_id: number; name: string; student_code: string; }

function fmt(n: number) { return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function InventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [stats, setStats] = useState({ totalValue: 0, lowStock: 0, totalSales: 0 });

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [productForm, setProductForm] = useState({ name: "", sku: "", description: "", category_id: "", cost_price: "", selling_price: "", quantity: "", unit: "pcs" });
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "", contact_name: "", phone: "", email: "", address: "" });
  const [stockForm, setStockForm] = useState({ product_id: "", quantity: "", unit_cost: "", notes: "", movement_type: "restock" });

  const [cart, setCart] = useState<{ product_id: number; name: string; price: number; qty: number }[]>([]);
  const [posStudent, setPosStudent] = useState("");
  const [posPayment, setPosPayment] = useState("cash");
  const [saleProcessing, setSaleProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, stRes] = await Promise.all([fetch("/api/admin/inventory"), fetch("/api/students?limit=200")]);
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

  const handleSaveProduct = async () => {
    try {
      const action = selectedProduct ? "update_product" : "create_product";
      const body = selectedProduct ? { action, id: selectedProduct.id, ...productForm } : { action, ...productForm };
      const res = await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: selectedProduct ? "Product updated" : "Product created" });
      setProductFormOpen(false); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_product", id: selectedProduct.id }) });
    toast({ title: "Success" }); setDeleteOpen(false); setSelectedProduct(null); fetchData();
  };

  const handleSaveCategory = async () => {
    try {
      await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_category", ...catForm }) });
      toast({ title: "Success" }); setCatFormOpen(false); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleSaveSupplier = async () => {
    try {
      const action = selectedSupplier ? "update_supplier" : "create_supplier";
      await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...supplierForm }) });
      toast({ title: "Success" }); setSupplierFormOpen(false); setSelectedSupplier(null); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleStockMovement = async () => {
    try {
      const action = stockForm.movement_type === "restock" ? "add_stock" : stockForm.movement_type === "adjustment" ? "adjust_stock" : "add_stock";
      await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...stockForm }) });
      toast({ title: "Success", description: `Stock ${stockForm.movement_type} completed` });
      setStockFormOpen(false); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    await fetch(`/api/admin/inventory?action=supplier&id=${selectedSupplier.supplier_id}`, { method: "DELETE" });
    toast({ title: "Success" }); setDeleteOpen(false); setSelectedSupplier(null); fetchData();
  };

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) { toast({ title: "Out of stock", variant: "destructive" }); return; }
    const existing = cart.find(c => c.product_id === p.id);
    if (existing) {
      if (existing.qty >= p.quantity) { toast({ title: "Max stock reached", variant: "destructive" }); return; }
      setCart(cart.map(c => c.product_id === p.id ? { ...c, qty: c.qty + 1 } : c));
    } else setCart([...cart, { product_id: p.id, name: p.name, price: p.selling_price, qty: 1 }]);
  };
  const updateCartQty = (pid: number, qty: number) => { if (qty <= 0) setCart(cart.filter(c => c.product_id !== pid)); else setCart(cart.map(c => c.product_id === pid ? { ...c, qty } : c)); };
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartItems = cart.length;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaleProcessing(true);
    try {
      await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_sale", student_id: posStudent || null, payment_method: posPayment, items: cart.map(c => ({ product_id: c.product_id, quantity: c.qty, unit_price: c.price })) }) });
      toast({ title: "Success", description: "Sale completed" }); setCart([]); setPosStudent(""); fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaleProcessing(false);
  };

  const filteredProducts = products.filter(p => search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = products.filter(p => p.quantity <= 5);

  const openProductForm = (p?: Product) => {
    setSelectedProduct(p || null);
    setProductForm(p ? { name: p.name, sku: p.sku, description: p.description, category_id: p.category_id?.toString() || "", cost_price: p.cost_price.toString(), selling_price: p.selling_price.toString(), quantity: p.quantity.toString(), unit: p.unit } : { name: "", sku: "", description: "", category_id: "", cost_price: "", selling_price: "", quantity: "", unit: "pcs" });
    setProductFormOpen(true);
  };
  const openSupplierForm = (s?: Supplier) => {
    setSelectedSupplier(s || null);
    setSupplierForm(s ? { name: s.name, contact_name: s.contact_name, phone: s.phone, email: s.email, address: s.address } : { name: "", contact_name: "", phone: "", email: "", address: "" });
    setSupplierFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Package className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Inventory Management</h1><p className="text-emerald-200 text-xs hidden sm:block">Products, Sales & Stock</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <StatCard icon={Package} label="Products" value={products.length} color="emerald" />
              <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} color="amber" />
              <StatCard icon={DollarSign} label="Stock Value" value={fmt(stats.totalValue)} color="sky" />
              <StatCard icon={TrendingUp} label="Total Sales" value={fmt(stats.totalSales)} color="violet" />
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap w-full sm:w-auto">
            <TabsTrigger value="products" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><Package className="w-4 h-4 mr-1 hidden sm:inline" /> Products</TabsTrigger>
            <TabsTrigger value="pos" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><ShoppingCart className="w-4 h-4 mr-1 hidden sm:inline" /> POS</TabsTrigger>
            <TabsTrigger value="sales" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" /> Sales</TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><ArrowUpDown className="w-4 h-4 mr-1 hidden sm:inline" /> Stock</TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><Truck className="w-4 h-4 mr-1 hidden sm:inline" /> Suppliers</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-[70px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-xs sm:text-sm"><Tag className="w-4 h-4 mr-1 hidden sm:inline" /> Categories</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /><Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setSearch("")}><X className="w-3 h-3" /></Button></div>
              <Button onClick={() => openProductForm()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
            </div>
            {lowStockItems.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{lowStockItems.length} items are low stock (≤5 units)</span></div>
            )}
            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Product</TableHead><TableHead className="hidden sm:table-cell">SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="w-28"></TableHead></TableRow></TableHeader>
                <TableBody>{filteredProducts.map(p => (
                  <TableRow key={p.id}><TableCell className="font-medium text-sm">{p.name}</TableCell><TableCell className="hidden sm:table-cell text-xs text-slate-500 font-mono">{p.sku}</TableCell><TableCell><Badge variant="outline" className="text-xs">{p.category?.name || "—"}</Badge></TableCell>
                    <TableCell className="text-right"><span className={p.quantity <= 5 ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>{p.quantity}</span><span className="text-slate-400 ml-1">{p.unit}</span></TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(p.selling_price)}</TableCell>
                    <TableCell><div className="flex gap-1 justify-end"><Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600" onClick={() => addToCart(p)}><ShoppingCartIcon className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => openProductForm(p)}><Pencil className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="h-8 text-xs text-red-600" onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button></div></TableCell>
                  </TableRow>))}</TableBody></Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* POS Tab */}
          <TabsContent value="pos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-slate-200/60"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-emerald-600" /> Select Products</CardTitle></CardHeader><CardContent>
                  <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {products.filter(p => p.quantity > 0).map(p => (
                      <Card key={p.id} className={`cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all ${cart.some(c => c.product_id === p.id) ? "border-emerald-500 border-2 bg-emerald-50/30" : ""}`} onClick={() => addToCart(p)}>
                        <CardContent className="p-3 text-center">
                          <Package className={`w-8 h-8 mx-auto mb-1 ${cart.some(c => c.product_id === p.id) ? "text-emerald-600" : "text-slate-400"}`} />
                          <p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-slate-500">{p.quantity} {p.unit}</p><p className="text-sm font-bold text-emerald-700 mt-1">{fmt(p.selling_price)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent></Card>
              </div>
              <div>
                <Card className="border-slate-200/60 sticky top-20"><CardHeader className="pb-3"><CardTitle className="text-base">Cart ({cartItems})</CardTitle></CardHeader><CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4">{cart.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Cart is empty</p> : cart.map(c => (
                    <div key={c.product_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.name}</p><p className="text-xs text-slate-500">{fmt(c.price)} × {c.qty}</p></div>
                      <div className="flex items-center gap-1"><Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQty(c.product_id, c.qty - 1)}><Minus className="w-3 h-3" /></Button><span className="text-sm w-6 text-center">{c.qty}</span><Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQty(c.product_id, c.qty + 1)}><Plus className="w-3 h-3" /></Button></div>
                    </div>
                  ))}</div>
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{fmt(cartTotal)}</span></div>
                    <Select value={posStudent} onValueChange={setPosStudent}><SelectTrigger><SelectValue placeholder="Student (optional)" /></SelectTrigger><SelectContent className="max-h-40"><SelectItem value="none">Walk-in</SelectItem>{students.map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={posPayment} onValueChange={setPosPayment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="bank_transfer">Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent></Select>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" onClick={handleCheckout} disabled={cart.length === 0 || saleProcessing}>{saleProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Complete Sale"}</Button>
                  </div>
                </CardContent></Card>
              </div>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <Card className="border-slate-200/60"><CardContent className="p-0"><div className="max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Items</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
              <TableBody>{sales.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">No sales</TableCell></TableRow> : sales.map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedSale(s)}>
                  <TableCell className="text-sm">{s.sale_date ? format(new Date(s.sale_date), "MMM d, yyyy") : "—"}</TableCell><TableCell className="text-sm">{s.student?.name || "Walk-in"}</TableCell><TableCell className="hidden sm:table-cell text-xs text-slate-500">{s.sale_items?.length || 0} items</TableCell>
                  <TableCell className="text-right font-medium text-sm">{fmt(s.total_amount)}</TableCell><TableCell><Badge variant="outline" className="text-xs capitalize">{s.payment_method.replace(/_/g, " ")}</Badge></TableCell><TableCell><Badge className={s.status === "completed" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{s.status}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedSale(s); }}><Eye className="w-3 h-3" /></Button></TableCell>
                </TableRow>))}</TableBody></Table>
              </div></CardContent></Card>
          </TabsContent>

          {/* Stock Movements Tab */}
          <TabsContent value="stock">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setStockForm({ product_id: "", quantity: "", unit_cost: "", notes: "", movement_type: "restock" })} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Stock Movement</Button>
            </div>
            <Card className="border-slate-200/60"><CardContent className="p-0"><div className="max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Product ID</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Prev</TableHead><TableHead className="text-right">New</TableHead><TableHead className="hidden sm:table-cell">Notes</TableHead></TableRow></TableHeader>
              <TableBody>{movements.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No movements</TableCell></TableRow> : movements.map(m => (
                <TableRow key={m.stock_movement_id}>
                  <TableCell className="text-xs">{m.movement_date ? format(new Date(m.movement_date), "MMM d, HH:mm") : "—"}</TableCell><TableCell className="text-xs font-mono">{m.product_id || "—"}</TableCell>
                  <TableCell><Badge className={m.movement_type === "restock" ? "bg-emerald-100 text-emerald-700 text-xs" : m.movement_type === "sale" ? "bg-red-100 text-red-700 text-xs" : "bg-sky-100 text-sky-700 text-xs"}>{m.movement_type}</Badge></TableCell>
                  <TableCell className="text-right text-sm font-medium">{m.movement_type === "sale" ? "-" : `+${m.quantity}`}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">{m.previous_stock}</TableCell><TableCell className="text-right text-sm font-medium">{m.new_stock}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-slate-500 max-w-32 truncate">{m.notes}</TableCell>
                </TableRow>))}</TableBody></Table>
              </div></CardContent></Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <div className="flex justify-end mb-4"><Button onClick={() => openSupplierForm()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Supplier</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.length === 0 && <div className="col-span-full"><EmptyState icon={Truck} label="No suppliers yet" sub="Add your first supplier" /></div>}
              {suppliers.map(sup => (
                <Card key={sup.supplier_id} className="border-l-4 border-l-emerald-500 hover:shadow-sm"><CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-slate-900">{sup.name}</h3><Badge className={sup.is_active === 1 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{sup.is_active === 1 ? "Active" : "Inactive"}</Badge></div>
                  {sup.contact_name && <p className="text-xs text-slate-500 mb-1">Contact: {sup.contact_name}</p>}
                  <p className="text-xs text-slate-500">{sup.phone || "No phone"} {sup.email ? `· ${sup.email}` : ""}</p>
                  {sup.address && <p className="text-xs text-slate-400 mt-1">{sup.address}</p>}
                  <div className="flex gap-1 pt-2 mt-2 border-t"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openSupplierForm(sup)}><Pencil className="w-3 h-3 mr-1" />Edit</Button><Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedSupplier(sup); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button></div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4"><Button onClick={() => { setCatForm({ name: "", description: "" }); setCatFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Category</Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 && <div className="col-span-full"><EmptyState icon={Tag} label="No categories yet" sub="Create your first category" /></div>}
              {categories.map(cat => (
                <Card key={cat.id} className="hover:shadow-sm border-slate-200/60"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-slate-900">{cat.name}</h3><Badge variant="secondary" className="text-xs">{cat._count?.products || 0}</Badge></div><p className="text-xs text-slate-500">{cat.description || "No description"}</p></CardContent></Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Form Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selectedProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid gap-2"><Label>Product Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>SKU</Label><Input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></div><div className="grid gap-2"><Label>Unit</Label><Select value={productForm.unit} onValueChange={v => setProductForm({ ...productForm, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pcs">Pieces</SelectItem><SelectItem value="box">Box</SelectItem><SelectItem value="pack">Pack</SelectItem><SelectItem value="kg">KG</SelectItem><SelectItem value="litre">Litre</SelectItem></SelectContent></Select></div></div>
        <div className="grid gap-2"><Label>Category</Label><Select value={productForm.category_id} onValueChange={v => setProductForm({ ...productForm, category_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Cost</Label><Input type="number" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} /></div><div className="grid gap-2"><Label>Selling Price</Label><Input type="number" value={productForm.selling_price} onChange={e => setProductForm({ ...productForm, selling_price: e.target.value })} /></div><div className="grid gap-2"><Label>Quantity</Label><Input type="number" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} /></div></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setProductFormOpen(false)}>Cancel</Button><Button onClick={handleSaveProduct} className="bg-emerald-600 hover:bg-emerald-700" disabled={!productForm.name.trim()}>{selectedProduct ? "Update" : "Create"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Name *</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div><div className="grid gap-2"><Label>Description</Label><Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} /></div></div><DialogFooter><Button variant="outline" onClick={() => setCatFormOpen(false)}>Cancel</Button><Button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700" disabled={!catForm.name.trim()}>Create</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid gap-2"><Label>Company Name *</Label><Input value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Contact Name</Label><Input value={supplierForm.contact_name} onChange={e => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} /></div><div className="grid gap-2"><Label>Phone</Label><Input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div></div>
        <div className="grid gap-2"><Label>Email</Label><Input value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Address</Label><Textarea value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} rows={2} /></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setSupplierFormOpen(false)}>Cancel</Button><Button onClick={handleSaveSupplier} className="bg-emerald-600 hover:bg-emerald-700" disabled={!supplierForm.name.trim()}>{selectedSupplier ? "Update" : "Create"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={stockFormOpen} onOpenChange={setStockFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Stock Movement</DialogTitle><DialogDescription>Add stock or adjust inventory levels</DialogDescription></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid gap-2"><Label>Movement Type *</Label><Select value={stockForm.movement_type} onValueChange={v => setStockForm({ ...stockForm, movement_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="restock">Restock (In)</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem></SelectContent></Select></div>
        <div className="grid gap-2"><Label>Product *</Label><Select value={stockForm.product_id} onValueChange={v => setStockForm({ ...stockForm, product_id: v })}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent className="max-h-48">{products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} (Stock: {p.quantity})</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Quantity *</Label><Input type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} /></div><div className="grid gap-2"><Label>Unit Cost</Label><Input type="number" value={stockForm.unit_cost} onChange={e => setStockForm({ ...stockForm, unit_cost: e.target.value })} /></div></div>
        <div className="grid gap-2"><Label>Notes</Label><Input value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="e.g., Supplier delivery" /></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setStockFormOpen(false)}>Cancel</Button><Button onClick={handleStockMovement} className="bg-emerald-600 hover:bg-emerald-700" disabled={!stockForm.product_id || !stockForm.quantity}>{stockForm.movement_type === "restock" ? "Add Stock" : "Adjust Stock"}</Button></DialogFooter></DialogContent></Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={open => { if (!open) setSelectedSale(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedSale && (<>
            <DialogHeader><DialogTitle>Sale Receipt #{selectedSale.id}</DialogTitle><DialogDescription>{selectedSale.sale_date ? format(new Date(selectedSale.sale_date), "MMMM d, yyyy HH:mm") : "—"}</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{fmt(selectedSale.total_amount)}</p>
                <div className="flex items-center justify-center gap-2 mt-1"><Badge className="bg-emerald-100 text-emerald-700">Completed</Badge><Badge variant="outline" className="text-xs">{selectedSale.payment_method.replace(/_/g, " ")}</Badge></div>
              </div>
              {selectedSale.student && <div className="bg-slate-50 rounded-lg p-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">{selectedSale.student.name.charAt(0)}</div><div><p className="font-medium">{selectedSale.student.name}</p><p className="text-xs text-slate-500">{selectedSale.student.student_code}</p></div></div></div>}
              <div className="border-t pt-4"><h4 className="text-sm font-semibold mb-2">Items ({selectedSale.sale_items?.length || 0})</h4>
                <Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>
                  {selectedSale.sale_items?.map(item => (<TableRow key={item.id}><TableCell className="text-sm">{item.product?.name || `#${item.product_id}`}</TableCell><TableCell className="text-sm text-center">{item.quantity}</TableCell><TableCell className="text-right text-sm">{fmt(item.unit_price)}</TableCell><TableCell className="text-right font-medium text-sm">{fmt(item.subtotal)}</TableCell></TableRow>))}
                </TableBody></Table>
                <div className="flex justify-end pt-2 font-bold text-sm"><span>Grand Total: {fmt(selectedSale.total_amount)}</span></div>
              </div>
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Delete</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this {selectedProduct ? "product" : "supplier"}?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (selectedProduct) handleDeleteProduct(); else handleDeleteSupplier(); }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent></AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const c: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", sky: "bg-sky-100 text-sky-600", amber: "bg-amber-100 text-amber-600", violet: "bg-violet-100 text-violet-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${c[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}

function EmptyState({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (<Card className="col-span-full"><CardContent className="py-16 text-center text-slate-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">{label}</p>{sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}</CardContent></Card>);
}
