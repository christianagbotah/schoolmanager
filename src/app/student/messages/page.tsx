"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Plus,
  Inbox,
  Search,
  User,
  Clock,
  Reply,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface MessageThread {
  message_thread_id: number;
  subject: string;
  partner_name: string;
  partner_type: string;
  last_message: string;
  last_message_time: string | null;
  unread_count: number;
}

interface ThreadMessage {
  message_id: number;
  message_thread_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  sent_on: string | null;
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/student/messages");
      if (res.ok) {
        const d = await res.json();
        setThreads(d.threads || []);
      }
    } catch {
      setError("Failed to load messages");
    }
    finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) fetchMessages();
  }, [authLoading, fetchMessages]);

  const handleSelectThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    try {
      const res = await fetch(`/api/student/messages?thread_id=${thread.message_thread_id}`);
      if (res.ok) {
        const d = await res.json();
        setThreadMessages(d.messages || []);
      }
    } catch {
      /* silent */
    }
  };

  const handleComposeSend = async () => {
    if (!composeTo || !composeBody) return;
    setIsSending(true);
    try {
      const [receiverType, receiverId] = composeTo.split("-");
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_new", receiver_id: parseInt(receiverId), receiver_type, message: composeBody }),
      });
      if (!res.ok) throw new Error("Failed");
      setComposeOpen(false);
      setComposeTo("");
      setComposeBody("");
      fetchMessages();
    } catch {
      setError("Failed to send message");
    }
    finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyBody) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_reply", thread_id: selectedThread.message_thread_id, message: replyBody }),
      });
      if (!res.ok) throw new Error("Failed");
      setReplyBody("");
      setReplyOpen(false);
      handleSelectThread(selectedThread);
    } catch {
      setError("Failed to send reply");
    }
    finally {
      setIsSending(false);
    }
  };

  const handleDeleteThread = async (threadId: number) => {
    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", thread_id: threadId }),
      });
      if (res.ok) {
        if (selectedThread?.message_thread_id === threadId) setSelectedThread(null);
        fetchMessages();
      }
    } catch {
      /* silent */
    }
  };

  const unreadCount = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
  const filteredThreads = threads.filter((t) => {
    const q = search.toLowerCase();
    return t.partner_name?.toLowerCase().includes(q) || t.last_message?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
              <p className="text-sm text-slate-500 mt-1">Communication with teachers and parents</p>
            </div>
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>}
          </div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 min-w-[44px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>To (e.g. teacher-1)</Label>
                  <Input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="teacher-1 or parent-5" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4} placeholder="Type your message..." />
                </div>
                <Button onClick={handleComposeSend} disabled={isSending} className="w-full bg-amber-600 hover:bg-amber-700 min-h-[44px]">
                  {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Thread List + Conversation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <Card className="gap-4 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Conversations ({threads.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No conversations yet</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-1">
                    {filteredThreads.map((thread) => (
                      <div
                        key={thread.message_thread_id}
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedThread?.message_thread_id === thread.message_thread_id
                            ? "border-amber-300 bg-amber-50"
                            : thread.unread_count > 0
                            ? "bg-slate-50 border-slate-200"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                        onClick={() => handleSelectThread(thread)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${thread.unread_count > 0 ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                                {thread.partner_name}
                              </p>
                              {thread.unread_count > 0 && (
                                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[18px] text-center">
                                  {thread.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{thread.last_message}</p>
                            {thread.last_message_time && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(new Date(thread.last_message_time), "MMM d, HH:mm")}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.message_thread_id); }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Conversation View */}
          <Card className="gap-4 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {selectedThread ? `${selectedThread.partner_name}` : "Select a conversation"}
                </CardTitle>
                {selectedThread && (
                  <Button variant="outline" size="sm" onClick={() => setReplyOpen(true)} className="min-w-[44px] min-h-[44px]">
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedThread ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Select a conversation to view messages</p>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No messages yet. Be the first to say hello!</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {threadMessages.map((msg) => {
                      const isMine = msg.sender_type === "student";
                      return (
                        <div key={msg.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isMine
                                ? "bg-amber-600 text-white rounded-br-md"
                                : "bg-slate-100 text-slate-900 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            {msg.sent_on && (
                              <p className={`text-[10px] mt-1 ${isMine ? "text-amber-200" : "text-slate-400"}`}>
                                {format(new Date(msg.sent_on), "MMM d, yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reply Dialog */}
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to {selectedThread?.partner_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={4} placeholder="Type your reply..." />
              <Button onClick={handleReply} disabled={isSending || !replyBody} className="w-full bg-amber-600 hover:bg-amber-700 min-h-[44px]">
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Reply
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
