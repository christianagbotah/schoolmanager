"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Plus, Search, Pencil, Trash2, ShoppingCart, DollarSign,
  AlertTriangle, TrendingUp, Tag, BarChart3,
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

interface Product {
  id: number; name: string; sku: string; description: string;
  category_id: number | null; cost_price: number; selling_price: number;
  quantity: number; unit: string;
  category: { id: number; name: string } | null;
}

interface Category {
  id: number; name: string; description: string; is_active: number;
  products: Product[];
}

interface Sale {
  id: number; student_id: number | null; sale_date: string | null;
  total_amount: number; payment_method: string; status: string;
  sale_items: SaleItem[];
  student: { student_id: number; name: string; student_code: string } | null;
}

interface SaleItem {
  id: number; sale_id: number; product_id: number;
  quantity: number; unit_price: number; subtotal: number;
  product: Product | null;
}

interface Student { student_id: number; name: string; student_code: string; }

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  const [productForm, setProductForm] = useState({
    name: "", sku: "", description: "", category_id: "",
    cost_price: "", selling_price: "", quantity: "", unit: "pcs",
  });
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  // POS state
  const [cart, setCart] = useState<{ product_id: number; name: string; price: number; qty: number }[]>([]);
  const [posStudent, setPosStudent] = useState("");
  const [posPayment, setPosPayment] = useState("cash");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, saleRes, stRes] = await Promise.all([
        fetch("/api/inventory/products/route"),
        fetch("/api/inventory/categories/route"),
        fetch("/api/inventory/sales/route"),
        fetch("/api/students"),
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
      setSales(await saleRes.json());
      const stData = await stRes.json();
      setStudents(Array.isArray(stData) ? stData.slice(0, 200) : []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveProduct = async () => {
    try {
      const url = selectedProduct ? `/api/inventory/products/route?id=${selectedProduct.id}` : "/api/inventory/products/route";
      const method = selectedProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(productForm) });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: selectedProduct ? "Product updated" : "Product created" });
      setProductFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    await fetch(`/api/inventory/products/route?id=${selectedProduct.id}`, { method: "DELETE" });
    toast({ title: "Success", description: "Product deleted" });
    setDeleteOpen(false);
    fetchData();
  };

  const handleSaveCategory = async () => {
    try {
      const url = selectedCat ? `/api/inventory/categories/route?id=${selectedCat.id}` : "/api/inventory/categories/route";
      const method = selectedCat ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
      toast({ title: "Success" });
      setCatFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const addToCart = (p: Product) => {
    const existing = cart.find(c => c.product_id === p.id);
    if (existing) setCart(cart.map(c => c.product_id === p.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { product_id: p.id, name: p.name, price: p.selling_price, qty: 1 }]);
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) setCart(cart.filter(c => c.product_id !== productId));
    else setCart(cart.map(c => c.product_id === productId ? { ...c, qty } : c));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await fetch("/api/inventory/sales/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: posStudent || null,
          payment_method: posPayment,
          items: cart.map(c => ({ product_id: c.product_id, quantity: c.qty, unit_price: c.price })),
        }),
      });
      toast({ title: "Success", description: "Sale completed" });
      setCart([]);
      setPosOpen(false);
      fetchData();
    } catch { toast({ title: "Error", description: "Sale failed", variant: "destructive" }); }
  };

  const totalValue = products.reduce((s, p) => s + p.selling_price * p.quantity, 0);
  const lowStock = products.filter(p => p.quantity <= 5);
  const totalSales = sales.reduce((s, sl) => s + sl.total_amount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Package className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Inventory</h1><p className="text-emerald-200 text-xs hidden sm:block">Stock & Sales</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Package} label="Total Products" value={products.length} color="emerald" />
          <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock.length} color="amber" />
          <StatCard icon={DollarSign} label="Stock Value" value={`GHS ${totalValue.toLocaleString()}`} color="blue" />
          <StatCard icon={TrendingUp} label="Total Sales" value={`GHS ${totalSales.toLocaleString()}`} color="purple" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap w-full sm:w-auto">
            <TabsTrigger value="products" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Package className="w-4 h-4 mr-1 hidden sm:inline" /> Products</TabsTrigger>
            <TabsTrigger value="pos" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><ShoppingCart className="w-4 h-4 mr-1 hidden sm:inline" /> POS</TabsTrigger>
            <TabsTrigger value="sales" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" /> Sales</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Tag className="w-4 h-4 mr-1 hidden sm:inline" /> Categories</TabsTrigger>
          </TabsList>

          {/* Products */}
          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
              <Button onClick={() => { setSelectedProduct(null); setProductForm({ name: "", sku: "", description: "", category_id: "", cost_price: "", selling_price: "", quantity: "", unit: "pcs" }); setProductFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
            </div>
            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Product</TableHead><TableHead className="hidden sm:table-cell">SKU</TableHead><TableHead>Category</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>) :
                    products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500">{p.sku}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.category?.name || "—"}</Badge></TableCell>
                        <TableCell><Badge className={p.quantity <= 5 ? "bg-red-100 text-red-700 text-xs" : "bg-emerald-100 text-emerald-700 text-xs"}>{p.quantity} {p.unit}</Badge></TableCell>
                        <TableCell className="text-sm font-medium">GHS {p.selling_price}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => addToCart(p)}><ShoppingCart className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedProduct(p); setProductForm({ name: p.name, sku: p.sku, description: p.description, category_id: p.category_id?.toString() || "", cost_price: p.cost_price.toString(), selling_price: p.selling_price.toString(), quantity: p.quantity.toString(), unit: p.unit }); setProductFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* POS */}
          <TabsContent value="pos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-slate-200/60">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Products</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" /></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {products.filter(p => p.quantity > 0).map(p => (
                        <Card key={p.id} className="cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all" onClick={() => addToCart(p)}>
                          <CardContent className="p-3 text-center">
                            <Package className="w-8 h-8 mx-auto mb-1 text-emerald-600" />
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.quantity} {p.unit}</p>
                            <p className="text-sm font-bold text-emerald-700 mt-1">GHS {p.selling_price}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="border-slate-200/60 sticky top-20">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Cart ({cart.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                      {cart.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Cart is empty</p> :
                        cart.map(c => (
                          <div key={c.product_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-slate-500">GHS {c.price} x {c.qty}</p></div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQty(c.product_id, c.qty - 1)}>-</Button>
                              <span className="text-sm w-6 text-center">{c.qty}</span>
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateCartQty(c.product_id, c.qty + 1)}>+</Button>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="border-t pt-3 space-y-3">
                      <div className="flex justify-between font-bold text-lg"><span>Total</span><span>GHS {cartTotal.toFixed(2)}</span></div>
                      <div className="grid gap-2">
                        <Select value={posStudent} onValueChange={setPosStudent}>
                          <SelectTrigger><SelectValue placeholder="Student (optional)" /></SelectTrigger>
                          <SelectContent className="max-h-40">{students.map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={posPayment} onValueChange={setPosPayment}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent>
                        </Select>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" onClick={handleCheckout} disabled={cart.length === 0}>Complete Sale</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Sales History */}
          <TabsContent value="sales">
            <Card className="border-slate-200/60"><CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Items</TableHead><TableHead>Amount</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sales.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No sales</TableCell></TableRow> :
                    sales.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.sale_date ? format(new Date(s.sale_date), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell className="text-sm">{s.student?.name || "Walk-in"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-slate-500">{s.sale_items?.length || 0} items</TableCell>
                        <TableCell className="font-medium text-sm">GHS {s.total_amount}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{s.payment_method.replace("_", " ")}</Badge></TableCell>
                        <TableCell><Badge className={s.status === "completed" ? "bg-emerald-100 text-emerald-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedCat(null); setCatForm({ name: "", description: "" }); setCatFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="border-slate-200/60 hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                      <Badge variant="secondary" className="text-xs">{cat.products?.length || 0}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{cat.description || "No description"}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedCat(cat); setCatForm({ name: cat.name, description: cat.description }); setCatFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Form */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>SKU</Label><Input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Unit</Label><Select value={productForm.unit} onValueChange={v => setProductForm({ ...productForm, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pcs">Pieces</SelectItem><SelectItem value="box">Box</SelectItem><SelectItem value="pack">Pack</SelectItem><SelectItem value="kg">KG</SelectItem><SelectItem value="litre">Litre</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label>Category</Label><Select value={productForm.category_id} onValueChange={v => setProductForm({ ...productForm, category_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2"><Label>Cost</Label><Input type="number" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Selling</Label><Input type="number" value={productForm.selling_price} onChange={e => setProductForm({ ...productForm, selling_price: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Quantity</Label><Input type="number" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="bg-emerald-600 hover:bg-emerald-700" disabled={!productForm.name.trim()}>{selectedProduct ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name *</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700" disabled={!catForm.name.trim()}>{selectedCat ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Delete <strong>{selectedProduct?.name}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const iconBg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}
