"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Plus, Pencil, Trash2, Users, Home, Building } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BoardingHouse {
  house_id: number; house_name: string; house_description: string; house_capacity: number;
}

interface Dormitory {
  dormitory_id: number; dormitory_name: string; dormitory_description: string;
  number_of_rooms: number; number_of_beds: number;
}

export default function BoardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [houses, setHouses] = useState<BoardingHouse[]>([]);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [loading, setLoading] = useState(true);

  const [houseFormOpen, setHouseFormOpen] = useState(false);
  const [dormFormOpen, setDormFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("house");
  const [selectedHouse, setSelectedHouse] = useState<BoardingHouse | null>(null);
  const [selectedDorm, setSelectedDorm] = useState<Dormitory | null>(null);
  const [activeTab, setActiveTab] = useState("houses");

  const [houseForm, setHouseForm] = useState({ house_name: "", house_description: "", house_capacity: "" });
  const [dormForm, setDormForm] = useState({ dormitory_name: "", dormitory_description: "", number_of_rooms: "", number_of_beds: "" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/boarding/houses/route");
        const data = await res.json();
        setHouses(data.houses || []);
        setDormitories(data.dormitories || []);
      } catch { /* empty */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveHouse = async () => {
    try {
      const body = { type: "house", ...houseForm };
      if (selectedHouse) {
        body.house_id = selectedHouse.house_id;
        await fetch("/api/boarding/houses/route", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/boarding/houses/route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      toast({ title: "Success" });
      setHouseFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleSaveDorm = async () => {
    try {
      const body = { type: "dormitory", ...dormForm };
      if (selectedDorm) {
        body.dormitory_id = selectedDorm.dormitory_id;
        await fetch("/api/boarding/houses/route", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/boarding/houses/route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      toast({ title: "Success" });
      setDormFormOpen(false);
      fetchData();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    const id = deleteType === "house" ? selectedHouse?.house_id : selectedDorm?.dormitory_id;
    if (!id) return;
    await fetch(`/api/boarding/houses/route?type=${deleteType}&id=${id}`, { method: "DELETE" });
    toast({ title: "Success", description: "Deleted" });
    setDeleteOpen(false);
    fetchData();
  };

  const totalBeds = dormitories.reduce((s, d) => s + d.number_of_beds, 0);
  const totalRooms = dormitories.reduce((s, d) => s + d.number_of_rooms, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><BedDouble className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Boarding</h1><p className="text-emerald-200 text-xs hidden sm:block">Houses & Dormitories</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Home} label="Houses" value={houses.length} color="emerald" />
          <StatCard icon={Building} label="Dormitories" value={dormitories.length} color="blue" />
          <StatCard icon={BedDouble} label="Total Beds" value={totalBeds} color="amber" />
          <StatCard icon={Users} label="Total Rooms" value={totalRooms} color="purple" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="houses" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Home className="w-4 h-4 mr-1 hidden sm:inline" /> Houses</TabsTrigger>
            <TabsTrigger value="dormitories" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Building className="w-4 h-4 mr-1 hidden sm:inline" /> Dormitories</TabsTrigger>
          </TabsList>

          <TabsContent value="houses">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedHouse(null); setHouseForm({ house_name: "", house_description: "", house_capacity: "" }); setHouseFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add House</Button>
            </div>
            {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {houses.map(house => (
                  <Card key={house.house_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Home className="w-4 h-4 text-emerald-600" /></div>
                          <h3 className="font-semibold text-slate-900">{house.house_name}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{house.house_description || "No description"}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">{house.house_capacity} capacity</Badge>
                      </div>
                      <div className="flex gap-1 pt-3 border-t border-slate-100">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedHouse(house); setHouseForm({ house_name: house.house_name, house_description: house.house_description, house_capacity: house.house_capacity.toString() }); setHouseFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedHouse(house); setDeleteType("house"); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dormitories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setSelectedDorm(null); setDormForm({ dormitory_name: "", dormitory_description: "", number_of_rooms: "", number_of_beds: "" }); setDormFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"><Plus className="w-4 h-4 mr-2" /> Add Dormitory</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dormitories.map(dorm => (
                <Card key={dorm.dormitory_id} className="border-slate-200/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Building className="w-4 h-4 text-blue-600" /></div>
                        <h3 className="font-semibold text-slate-900">{dorm.dormitory_name}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{dorm.dormitory_description || "No description"}</p>
                    <div className="flex gap-2 mb-3">
                      <Badge className="bg-blue-100 text-blue-700 text-xs">{dorm.number_of_rooms} rooms</Badge>
                      <Badge className="bg-amber-100 text-amber-700 text-xs">{dorm.number_of_beds} beds</Badge>
                    </div>
                    <div className="flex gap-1 pt-3 border-t border-slate-100">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedDorm(dorm); setDormForm({ dormitory_name: dorm.dormitory_name, dormitory_description: dorm.dormitory_description, number_of_rooms: dorm.number_of_rooms.toString(), number_of_beds: dorm.number_of_beds.toString() }); setDormFormOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setSelectedDorm(dorm); setDeleteType("dormitory"); setDeleteOpen(true); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={houseFormOpen} onOpenChange={setHouseFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedHouse ? "Edit House" : "Add House"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>House Name *</Label><Input value={houseForm.house_name} onChange={e => setHouseForm({ ...houseForm, house_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={houseForm.house_description} onChange={e => setHouseForm({ ...houseForm, house_description: e.target.value })} rows={2} /></div>
            <div className="grid gap-2"><Label>Capacity</Label><Input type="number" value={houseForm.house_capacity} onChange={e => setHouseForm({ ...houseForm, house_capacity: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHouseFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveHouse} className="bg-emerald-600 hover:bg-emerald-700" disabled={!houseForm.house_name.trim()}>{selectedHouse ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dormFormOpen} onOpenChange={setDormFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedDorm ? "Edit Dormitory" : "Add Dormitory"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Dormitory Name *</Label><Input value={dormForm.dormitory_name} onChange={e => setDormForm({ ...dormForm, dormitory_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={dormForm.dormitory_description} onChange={e => setDormForm({ ...dormForm, dormitory_description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Rooms</Label><Input type="number" value={dormForm.number_of_rooms} onChange={e => setDormForm({ ...dormForm, number_of_rooms: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Beds</Label><Input type="number" value={dormForm.number_of_beds} onChange={e => setDormForm({ ...dormForm, number_of_beds: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDormFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDorm} className="bg-emerald-600 hover:bg-emerald-700" disabled={!dormForm.dormitory_name.trim()}>{selectedDorm ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType === "house" ? "House" : "Dormitory"}</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const iconBg: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600" };
  return (<Card className="border-slate-200/60"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></CardContent></Card>);
}
