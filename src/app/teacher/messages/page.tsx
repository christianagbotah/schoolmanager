"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Send, Inbox, Plus, Loader2, AlertTriangle,
  Search, User, Clock, Reply, Paperclip, CheckCircle,
  ArrowLeft, Users, GraduationCap, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface MessageThread {
  message_thread_id: number;
  hash?: string;
  sender: string;
  reciever: string;
  last_message_timestamp?: string;
  last_message?: string;
}

interface Message {
  id: number;
  message_thread_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  file?: string;
  sent_on?: string;
}

interface Recipient {
  id: number;
  name: string;
  type: string;
  code?: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function getThreadPartner(sender: string, reciever: string, teacherId?: number): { name: string; type: string } {
  const teacherPrefix = `teacher-${teacherId || ""}`;
  const partnerStr = sender === teacherPrefix ? reciever : sender;
  const [type, id] = partnerStr.split("-");

  const typeNames: Record<string, string> = {
    parent: "Parent",
    admin: "Administrator",
    student: "Student",
    teacher: "Teacher",
  };

  return {
    name: typeNames[type] ? `${typeNames[type]} #${id}` : partnerStr,
    type: typeNames[type] || "Unknown",
  };
}

function getThreadType(sender: string, reciever: string): string {
  if (sender.includes("parent")) return "Parent";
  if (sender.includes("admin")) return "Admin";
  if (sender.includes("student")) return "Student";
  if (sender.includes("teacher")) return "Teacher";
  return "Unknown";
}

const TYPE_COLORS: Record<string, string> = {
  Parent: "bg-amber-100 text-amber-700",
  Admin: "bg-violet-100 text-violet-700",
  Student: "bg-sky-100 text-sky-700",
  Teacher: "bg-emerald-100 text-emerald-700",
};

const TYPE_AVATAR: Record<string, string> = {
  Parent: "bg-amber-100 text-amber-600",
  Admin: "bg-violet-100 text-violet-600",
  Student: "bg-sky-100 text-sky-600",
  Teacher: "bg-emerald-100 text-emerald-600",
};

// ─── Main Component ──────────────────────────────────────────
export default function TeacherMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose form
  const [composeRecipientType, setComposeRecipientType] = useState("");
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Recipients loaded from API
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Mobile view state
  const [showConversation, setShowConversation] = useState(false);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teacher/messages");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchThreads();
  }, [authLoading, fetchThreads]);

  // Load recipients when compose opens
  const handleOpenCompose = async () => {
    setComposeOpen(true);
    setComposeRecipientType("");
    setComposeRecipientId("");
    setComposeMessage("");
    setIsLoadingRecipients(true);
    try {
      // Load students from teacher's classes as potential recipients
      const studentsRes = await fetch("/api/teacher/students");
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        const studentList = Array.isArray(data) ? data : data.students || [];
        const mapped: Recipient[] = studentList.map((s: { student_id: number; name: string; student_code?: string; class_name?: string }) => ({
          id: s.student_id,
          name: `${s.name}${s.class_name ? ` (${s.class_name})` : ""}`,
          type: "student",
          code: s.student_code,
        }));
        setRecipients(mapped);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const fetchMessages = useCallback(async (threadId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/teacher/messages?thread_id=${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const handleThreadClick = (thread: MessageThread) => {
    setActiveThreadId(thread.message_thread_id);
    setShowConversation(true);
    fetchMessages(thread.message_thread_id);
  };

  const handleBack = () => {
    setShowConversation(false);
    setActiveThreadId(null);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!composeRecipientType || !composeRecipientId || !composeMessage) return;
    setIsSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const receiverId = `${composeRecipientType}-${composeRecipientId}`;
      const res = await fetch("/api/teacher/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId,
          message: composeMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSuccessMsg("Message sent successfully");
      setComposeOpen(false);
      fetchThreads();
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const [replyMessage, setReplyMessage] = useState("");

  const handleReply = async () => {
    if (!activeThreadId || !replyMessage) return;
    setIsSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/teacher/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: activeThreadId,
          message: replyMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSuccessMsg("Reply sent");
      setReplyMessage("");
      fetchMessages(activeThreadId);
    } catch {
      setError("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const q = search.toLowerCase();
    const partner = getThreadPartner(t.sender || "", t.reciever || "");
    return partner.name.toLowerCase().includes(q) || partner.type.toLowerCase().includes(q);
  });

  const activeThread = threads.find(t => t.message_thread_id === activeThreadId);

  // Group recipients by type
  const studentRecipients = recipients.filter(r => r.type === "student");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {showConversation && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="min-w-[44px] min-h-[44px] lg:hidden">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
              <p className="text-sm text-slate-500 mt-1">Communication with parents and staff</p>
            </div>
          </div>
          <Dialog open={composeOpen} onOpenChange={(open) => { setComposeOpen(open); if (!open) setSuccessMsg(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Send className="w-4 h-4 text-emerald-600" />
                  </div>
                  <DialogTitle>New Message</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />{successMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select value={composeRecipientType} onValueChange={(v) => { setComposeRecipientType(v); setComposeRecipientId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {composeRecipientType && composeRecipientType === "student" && (
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    {isLoadingRecipients ? (
                      <Skeleton className="h-10 w-full" />
                    ) : studentRecipients.length > 0 ? (
                      <Select value={composeRecipientId} onValueChange={setComposeRecipientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student..." />
                        </SelectTrigger>
                        <SelectContent>
                          {studentRecipients.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              <div className="flex items-center gap-2">
                                <span>{r.name}</span>
                                {r.code && <span className="text-xs text-slate-400">({r.code})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-slate-400">No students found in your classes</p>
                    )}
                  </div>
                )}
                {(composeRecipientType === "parent" || composeRecipientType === "admin" || composeRecipientType === "teacher") && (
                  <div className="space-y-2">
                    <Label>{composeRecipientType === "parent" ? "Parent" : composeRecipientType === "admin" ? "Admin" : "Teacher"} ID</Label>
                    <Input
                      type="number"
                      value={composeRecipientId}
                      onChange={(e) => setComposeRecipientId(e.target.value)}
                      placeholder={`Enter ${composeRecipientType} ID (e.g., 5)`}
                    />
                    <p className="text-xs text-slate-400">Enter the numeric ID of the {composeRecipientType}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your message..."
                    className="min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !composeRecipientType || !composeRecipientId || !composeMessage.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── Messages ─────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />{successMsg}
          </div>
        )}

        {/* ─── Chat Layout ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Thread List - hidden on mobile when conversation open */}
          <Card className={`gap-0 lg:row-span-2 ${showConversation ? "hidden lg:block" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">{threads.length} conversations</p>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search threads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                  <p className="text-slate-300 text-xs mt-1">Start a new conversation</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-1">
                  {filteredThreads.map((thread) => {
                    const isActive = activeThreadId === thread.message_thread_id;
                    const partner = getThreadPartner(thread.sender || "", thread.reciever || "");
                    return (
                      <div
                        key={thread.message_thread_id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isActive ? "border-emerald-300 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"
                        }`}
                        onClick={() => handleThreadClick(thread)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_AVATAR[partner.type] || "bg-slate-200 text-slate-500"}`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{partner.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[partner.type] || "bg-slate-100 text-slate-600"}`}>
                                {partner.type}
                              </Badge>
                              {thread.last_message && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                  {thread.last_message}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {thread.last_message_timestamp && (
                              <span className="text-[10px] text-slate-400">
                                {format(new Date(thread.last_message_timestamp), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation View - shown on mobile when active */}
          <Card className={`gap-0 lg:row-span-1 ${!showConversation ? "hidden lg:block" : ""}`}>
            {!activeThread ? (
              <CardContent className="py-16 flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Select a conversation to start</p>
                  <p className="text-slate-300 text-xs mt-1">Or compose a new message</p>
                </div>
              </CardContent>
            ) : (
              <>
                {/* Conversation Header */}
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_AVATAR[getThreadType(activeThread.sender || "", activeThread.reciever || "")] || "bg-slate-200 text-slate-500"}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {getThreadPartner(activeThread.sender || "", activeThread.reciever || "").name}
                        </p>
                        <Badge variant="secondary" className={`text-[10px] ${TYPE_COLORS[getThreadType(activeThread.sender || "", activeThread.reciever || "")] || "bg-slate-100 text-slate-600"}`}>
                          {getThreadType(activeThread.sender || "", activeThread.reciever || "")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="pt-0">
                  {isLoadingMessages ? (
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : (
                    <ScrollArea className="h-[350px]">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-slate-400">No messages in this conversation yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 py-2">
                          {messages.map((msg) => {
                            const isMine = msg.sender_type === "teacher";
                            return (
                              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                  isMine
                                    ? "bg-emerald-600 text-white rounded-br-sm"
                                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                  {msg.file && (
                                    <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                                      <Paperclip className="w-3 h-3" />
                                      {msg.file}
                                    </div>
                                  )}
                                  <p className={`text-[10px] mt-1 ${isMine ? "opacity-60" : "text-slate-400"}`}>
                                    {msg.sent_on ? format(new Date(msg.sent_on), "HH:mm") : ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  )}

                  {/* Reply area */}
                  <div className="border-t pt-3 mt-2">
                    <div className="flex gap-2">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 min-h-[44px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) handleReply();
                        }}
                      />
                      <Button
                        onClick={handleReply}
                        disabled={isSending || !replyMessage.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[44px] min-h-[44px]"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
