"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Send, Plus, Inbox, Search, User, Clock, Reply, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface Message { id: number; sender_id: number; receiver_id: number; subject: string; body: string; is_read: boolean; created_at: string; sender: { name: string }; receiver: { name: string }; }

export default function ParentMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try { const res = await fetch(`/api/messages?userId=${user.id}`); if (res.ok) { const d = await res.json(); setMessages(Array.isArray(d) ? d : []); } } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (!authLoading) fetchMessages(); }, [authLoading, fetchMessages]);

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setIsSending(true);
    try {
      await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender_id: user?.id, receiver_id: parseInt(composeTo), subject: composeSubject, body: composeBody }) });
      setComposeOpen(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); fetchMessages();
    } catch { /* silent */ } finally { setIsSending(false); }
  };

  const unread = messages.filter((m) => !m.is_read && m.receiver_id === parseInt(user?.id || "0")).length;
  const filtered = messages.filter((m) => { const q = search.toLowerCase(); return m.subject?.toLowerCase().includes(q) || m.body?.toLowerCase().includes(q); });

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3"><div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1><p className="text-sm text-slate-500 mt-1">Communicate with teachers</p></div>{unread > 0 && <Badge className="bg-red-500 text-white">{unread} unread</Badge>}</div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild><Button className="bg-purple-600 hover:bg-purple-700 min-w-[44px] min-h-[44px]"><Plus className="w-4 h-4 mr-2" />Compose</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>To (User ID)</Label><Input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} /></div>
                <div className="space-y-2"><Label>Subject</Label><Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4} /></div>
                <Button onClick={handleSend} disabled={isSending} className="w-full bg-purple-600 hover:bg-purple-700 min-h-[44px]">{isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Card className="gap-4"><CardContent className="pt-6">
          {filtered.length === 0 ? <div className="text-center py-12"><Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No messages</p></div> : (
            <ScrollArea className="max-h-[500px]"><div className="space-y-2">
              {filtered.map((msg) => (
                <div key={msg.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedMsg?.id === msg.id ? "border-purple-300 bg-purple-50" : !msg.is_read && msg.receiver_id === parseInt(user?.id || "0") ? "bg-slate-50 border-slate-200" : "border-slate-100 hover:bg-slate-50"}`} onClick={() => setSelectedMsg(msg)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-500" /></div>
                      <div className="min-w-0">
                        <p className={`text-sm ${!msg.is_read && msg.receiver_id === parseInt(user?.id || "0") ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{msg.sender?.name || "Unknown"}</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{msg.subject}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{msg.body}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1"><Clock className="w-3 h-3" />{msg.created_at ? format(new Date(msg.created_at), "MMM d, HH:mm") : ""}</span>
                  </div>
                </div>
              ))}
            </div></ScrollArea>
          )}
        </CardContent></Card>
        {selectedMsg && (
          <Card className="gap-4"><CardContent className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-900">{selectedMsg.subject}</h3>
              <Button variant="outline" size="sm" onClick={() => { setComposeOpen(true); setComposeSubject(`Re: ${selectedMsg.subject}`); }} className="min-w-[44px] min-h-[44px]"><Reply className="w-4 h-4 mr-1" />Reply</Button>
            </div>
            <p className="text-xs text-slate-400 mb-3">{selectedMsg.created_at ? format(new Date(selectedMsg.created_at), "EEEE, MMMM d, yyyy 'at' HH:mm") : ""}</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">{selectedMsg.body}</div>
          </CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
