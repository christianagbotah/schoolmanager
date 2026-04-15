"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Send, Plus, Inbox, Search, User, Clock, Reply, Loader2,
  Trash2, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface RecipientItem { id: number; name: string; email: string; phone: string; type: string; }
interface ThreadItem {
  message_thread_id: number; hash: string; subject: string;
  sender: string; reciever: string; last_message_timestamp: string | null;
}
interface MessageItem {
  message_id: number; sender_id: number; sender_type: string;
  message: string; file: string; sent_on: string | null;
}

export default function ParentMessagesPage() {
  const { user, isLoading: authLoading, isParent } = useAuth();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [recipients, setRecipients] = useState<RecipientItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/parent/messages");
      if (res.ok) { const d = await res.json(); setThreads(d.threads || []); }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [user?.id]);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/messages?action=recipients");
      if (res.ok) { const d = await res.json(); setRecipients(d.recipients || []); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (!authLoading && isParent) { fetchThreads(); fetchRecipients(); } }, [authLoading, isParent, fetchThreads, fetchRecipients]);

  const openThread = useCallback(async (threadId: number) => {
    setActiveThread(threadId);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/parent/messages?thread_id=${threadId}`);
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch { /* silent */ }
    finally { setMessagesLoading(false); }
  }, []);

  const handleCompose = async () => {
    if (!selectedRecipient || !composeMessage) return;
    setIsSending(true);
    try {
      await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_new", receiver_type: "teacher", receiver_id: parseInt(selectedRecipient), message: composeMessage }),
      });
      setComposeOpen(false);
      setSelectedRecipient("");
      setComposeMessage("");
      fetchThreads();
    } catch { /* silent */ }
    finally { setIsSending(false); }
  };

  const handleReply = async () => {
    if (!activeThread || !replyMessage) return;
    setIsSending(true);
    try {
      await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_reply", thread_id: activeThread, message: replyMessage }),
      });
      setReplyMessage("");
      openThread(activeThread);
    } catch { /* silent */ }
    finally { setIsSending(false); }
  };

  const handleDelete = async (threadId: number) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`/api/parent/messages?thread_id=${threadId}`, { method: "DELETE" });
      if (activeThread === threadId) { setActiveThread(null); setMessages([]); }
      fetchThreads();
    } catch { /* silent */ }
  };

  const getPartnerName = (thread: ThreadItem): string => {
    const parentCode = `parent-${user?.id}`;
    const otherCode = thread.sender === parentCode ? thread.reciever : thread.sender;
    if (!otherCode) return "Unknown";
    const parts = otherCode.split("-");
    const type = parts[0];
    const id = parts[1];
    if (type === "teacher") {
      const r = recipients.find(r => String(r.id) === id);
      return r?.name || "Teacher";
    }
    return otherCode;
  };

  if (isLoading) return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-sm text-slate-500 mt-1">Communicate with teachers</p>
          </div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"><Plus className="w-4 h-4 mr-2" />New Message</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>To (Teacher)</Label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                    <SelectContent>
                      {recipients.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Message</Label><Textarea value={composeMessage} onChange={e => setComposeMessage(e.target.value)} rows={4} placeholder="Type your message..." /></div>
                <Button onClick={handleCompose} disabled={isSending} className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                  {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <Card className="gap-4 lg:col-span-1">
            <CardContent className="pt-6">
              <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
              <ScrollArea className="max-h-[500px]">
                {threads.length === 0 ? (
                  <div className="text-center py-12"><Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No messages</p></div>
                ) : (
                  <div className="space-y-1">
                    {threads.filter(t => {
                      const name = getPartnerName(t).toLowerCase();
                      return name.includes(search.toLowerCase());
                    }).map((thread) => (
                      <div key={thread.message_thread_id} className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${activeThread === thread.message_thread_id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50 border border-transparent"}`} onClick={() => openThread(thread.message_thread_id)}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-500" /></div>
                          <div className="min-w-0"><p className="text-sm font-medium truncate">{getPartnerName(thread)}</p><p className="text-[10px] text-slate-400">{thread.last_message_timestamp ? format(new Date(thread.last_message_timestamp), "MMM d, HH:mm") : ""}</p></div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={e => { e.stopPropagation(); handleDelete(thread.message_thread_id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="gap-4 lg:col-span-2">
            <CardContent className="pt-6">
              {!activeThread ? (
                <div className="text-center py-20"><MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-600">Select a conversation</h3><p className="text-sm text-slate-400 mt-1">Choose a thread from the left to view messages</p></div>
              ) : messagesLoading ? (
                <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-12 w-5/6" /></div>
              ) : (
                <div>
                  <ScrollArea className="max-h-[400px] mb-4">
                    <div className="space-y-3 pr-4">
                      {messages.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No messages yet</p>}
                      {messages.map((msg) => {
                        const isMine = msg.sender_type === "parent";
                        return (
                          <div key={msg.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] p-3 rounded-xl ${isMine ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-slate-400"}`}>{msg.sent_on ? format(new Date(msg.sent_on), "MMM d, HH:mm") : ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <Input value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type a reply..." className="flex-1" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleReply(); }} />
                    <Button onClick={handleReply} disabled={isSending} className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
