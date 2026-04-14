"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Plus, Search, Send, Paperclip, ArrowLeft, Inbox, User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  message_id: number; message_thread_id: number; sender_id: number;
  message: string; file: string; sent_on: string | null;
}

interface MessageThread {
  message_thread_id: number; hash: string; subject: string;
  last_message_timestamp: string | null; participant_ids: string;
  messages: { message: string; sent_on: string | null }[];
}

interface Student { student_id: number; name: string; student_code: string; }
interface Teacher { teacher_id: number; name: string; email: string; }

export default function MessagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileThread, setShowMobileThread] = useState(false);

  // Compose form
  const [composeForm, setComposeForm] = useState({ subject: "", recipient_type: "student", recipient_id: "", message: "" });

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/messages/route?${params}`);
      setThreads(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    fetch("/api/students").then(r => r.json()).then(d => setStudents(Array.isArray(d) ? d.slice(0, 50) : []));
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(Array.isArray(d) ? d.slice(0, 50) : []));
  }, []);

  const openThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    setShowMobileThread(true);
    try {
      const res = await fetch(`/api/messages/route?thread_id=${thread.message_thread_id}`);
      setCurrentMessages(await res.json());
    } catch { /* empty */ }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    try {
      await fetch("/api/messages/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: selectedThread.message_thread_id,
          sender_id: 1,
          message: newMessage,
        }),
      });
      setNewMessage("");
      const res = await fetch(`/api/messages/route?thread_id=${selectedThread.message_thread_id}`);
      setCurrentMessages(await res.json());
      fetchThreads();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleCompose = async () => {
    try {
      const recipientId = parseInt(composeForm.recipient_id);
      if (!recipientId) return;

      // Create thread
      const threadRes = await fetch("/api/messages/route", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: composeForm.subject, participant_ids: `${recipientId},1` }),
      });
      const thread = await threadRes.json();

      // Send first message
      await fetch("/api/messages/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: thread.message_thread_id,
          sender_id: 1,
          message: composeForm.message,
        }),
      });

      toast({ title: "Success", description: "Message sent" });
      setComposeOpen(false);
      setComposeForm({ subject: "", recipient_type: "student", recipient_id: "", message: "" });
      fetchThreads();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const lastMessage = (thread: MessageThread) => thread.messages?.[0]?.message || "No messages";
  const lastTime = (thread: MessageThread) => thread.last_message_timestamp ? format(new Date(thread.last_message_timestamp), "MMM d, HH:mm") : "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Messages</h1><p className="text-emerald-200 text-xs hidden sm:block">Internal Messaging</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-white/20 hover:bg-white/30 text-white min-h-[44px]" onClick={() => setComposeOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Compose
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-180px)]">
          {/* Thread List */}
          <div className={`lg:col-span-2 ${showMobileThread ? "hidden lg:block" : "block"}`}>
            <Card className="border-slate-200/60 h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 min-h-[44px]" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 m-2 rounded" />) :
                    threads.length === 0 ? (
                      <div className="flex flex-col items-center py-12 px-4"><Inbox className="w-12 h-12 text-slate-300 mb-3" /><p className="text-sm text-slate-500">No conversations yet</p></div>
                    ) : (
                      threads.map(thread => (
                        <div
                          key={thread.message_thread_id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${selectedThread?.message_thread_id === thread.message_thread_id ? "bg-emerald-50" : ""}`}
                          onClick={() => openThread(thread)}
                        >
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">{getInitials(thread.subject)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">{thread.subject}</h3>
                              <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{lastTime(thread)}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{lastMessage(thread)}</p>
                          </div>
                        </div>
                      ))
                    )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Message View */}
          <div className={`lg:col-span-3 ${!showMobileThread ? "hidden lg:block" : "block"}`}>
            <Card className="border-slate-200/60 h-full flex flex-col">
              {selectedThread ? (
                <>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setShowMobileThread(false)}><ArrowLeft className="w-4 h-4" /></Button>
                      <Avatar className="w-8 h-8"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{getInitials(selectedThread.subject)}</AvatarFallback></Avatar>
                      <div><CardTitle className="text-sm">{selectedThread.subject}</CardTitle><p className="text-xs text-slate-500">{selectedThread.participant_ids}</p></div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-3">
                        {currentMessages.map(msg => (
                          <div key={msg.message_id} className={`flex ${msg.sender_id === 1 ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-xl p-3 ${msg.sender_id === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                              <p className="text-sm">{msg.message}</p>
                              {msg.file && <p className="text-xs mt-1 opacity-70 flex items-center gap-1"><Paperclip className="w-3 h-3" /> {msg.file}</p>}
                              <p className={`text-[10px] mt-1 ${msg.sender_id === 1 ? "text-emerald-200" : "text-slate-400"}`}>
                                {msg.sent_on ? format(new Date(msg.sent_on), "HH:mm") : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0"><Paperclip className="w-4 h-4 text-slate-400" /></Button>
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        className="min-h-[44px]"
                      />
                      <Button onClick={sendMessage} className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 flex-shrink-0" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">Select a conversation to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Message</DialogTitle><DialogDescription>Start a new conversation</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Subject *</Label><Input value={composeForm.subject} onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="Message subject" /></div>
            <div className="grid gap-2">
              <Label>Recipient</Label>
              <Select value={composeForm.recipient_type} onValueChange={v => setComposeForm({ ...composeForm, recipient_type: v, recipient_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Select Person</Label>
              <Select value={composeForm.recipient_id} onValueChange={v => setComposeForm({ ...composeForm, recipient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {composeForm.recipient_type === "student" ? students.map(s => <SelectItem key={s.student_id} value={s.student_id.toString()}>{s.name} ({s.student_code})</SelectItem>) :
                    teachers.map(t => <SelectItem key={t.teacher_id} value={t.teacher_id.toString()}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Message *</Label><Textarea value={composeForm.message} onChange={e => setComposeForm({ ...composeForm, message: e.target.value })} placeholder="Type your message..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleCompose} className="bg-emerald-600 hover:bg-emerald-700" disabled={!composeForm.subject.trim() || !composeForm.message.trim() || !composeForm.recipient_id}><Send className="w-4 h-4 mr-2" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
