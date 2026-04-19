'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare, Plus, Search, Send, Paperclip, ArrowLeft, Inbox,
  Smartphone, Users, Phone, X, Clock, Trash2, Bell,
  CheckCircle2, Circle, UsersRound, SendHorizonal,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============================================================
// Types
// ============================================================
interface MessageThread {
  message_thread_id: number; hash: string; subject: string;
  sender: string; reciever: string;
  last_message_timestamp: string | null; participant_ids: string;
  messages: { message: string; sent_on: string | null }[];
}

interface Message {
  message_id: number; message_thread_id: number; sender_id: number;
  sender_type: string; message: string; file: string; sent_on: string | null;
}

interface Recipient {
  value: string; label: string; type: string;
}

interface GroupMessage {
  group_message_id: number; title: string; message: string;
  target_group: string; recipient_ids: string; sender_id: number | null;
  sender_type: string; file: string; send_date: string | null;
  status: string; created_at: string | null;
  group_message_threads: { recipient_id: number | null; recipient_type: string; status: string; sent_at: string | null; read_at: string | null }[];
}

// ============================================================
// Skeleton Components
// ============================================================
function StatCardSkeleton() {
  return (
    <Card className="border-slate-200/60">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-slate-100">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ============================================================
// Phone Simulator Component
// ============================================================
function PhoneSimulator({ message }: { message: string }) {
  return (
    <div className="hidden lg:flex flex-col items-center">
      <div className="w-[260px] h-[520px] bg-slate-900 rounded-[32px] p-2.5 shadow-2xl">
        <div className="w-full h-full bg-slate-100 rounded-[24px] overflow-hidden flex flex-col">
          <div className="h-6 bg-slate-900 rounded-b-2xl mx-auto w-28 flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-700 rounded-full" />
          </div>
          <div className="px-4 py-1 flex justify-between text-[9px] text-slate-500">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5" />
              <span>100%</span>
            </span>
          </div>
          <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">School SMS</p>
              <p className="text-[9px] text-slate-400">SMS Preview</p>
            </div>
          </div>
          <div className="flex-1 p-3 bg-emerald-50/50 overflow-y-auto">
            {message.trim() ? (
              <div className="bg-white p-2.5 rounded-lg shadow-sm max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">{message}</p>
                <p className="text-[8px] text-slate-400 mt-1 text-right">
                  {format(new Date(), 'HH:mm')}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-[10px] text-slate-400">Type your message to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Message Status Indicator
// ============================================================
function MessageStatus({ sentOn, file }: { sentOn: string | null; file: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {file && (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
          <Paperclip className="w-2.5 h-2.5" />
        </span>
      )}
      {sentOn && (
        <span className="text-[10px] text-slate-400">
          {format(new Date(sentOn), 'HH:mm')}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MessagesPage() {
  const msgContentRef = useRef<HTMLDivElement>(null);

  // Main tab state
  const [mainTab, setMainTab] = useState('inapp');

  // In-App Messages State
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [composeForm, setComposeForm] = useState({ receiver: '', message: '', file: '' });
  const [sendingReply, setSendingReply] = useState(false);

  // SMS State
  const [smsType, setSmsType] = useState<string | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsRecipientType, setSmsRecipientType] = useState('3');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [sending, setSending] = useState(false);

  // Group Messages State
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupLoading, setGroupLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupMessage | null>(null);
  const [showMobileGroup, setShowMobileGroup] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ title: '', message: '', target_group: 'students', file: '' });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'thread' | 'group'; id: number } | null>(null);

  // ---- Data Fetching ----

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages');
      setThreads(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  const fetchGroupMessages = useCallback(async () => {
    setGroupLoading(true);
    try {
      const res = await fetch('/api/admin/messages?action=group_threads');
      setGroupMessages(await res.json());
    } catch { /* empty */ }
    setGroupLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchThreads(); }, [fetchThreads]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchGroupMessages(); }, [fetchGroupMessages]);

  useEffect(() => {
    fetch('/api/admin/messages?action=recipients')
      .then(r => r.json())
      .then(d => setRecipients(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ---- In-App Message Handlers ----

  const openThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    setShowMobileThread(true);
    try {
      const res = await fetch(`/api/admin/messages?thread_id=${thread.message_thread_id}`);
      setCurrentMessages(await res.json());
    } catch { /* empty */ }
    setTimeout(() => {
      if (msgContentRef.current) msgContentRef.current.scrollTop = msgContentRef.current.scrollHeight;
    }, 100);
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    setSendingReply(true);
    try {
      await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reply', thread_id: selectedThread.message_thread_id, message: newMessage }),
      });
      setNewMessage('');
      const res = await fetch(`/api/admin/messages?thread_id=${selectedThread.message_thread_id}`);
      setCurrentMessages(await res.json());
      fetchThreads();
      setTimeout(() => {
        if (msgContentRef.current) msgContentRef.current.scrollTop = msgContentRef.current.scrollHeight;
      }, 100);
    } catch {
      toast.error('Failed to send message');
    }
    setSendingReply(false);
  };

  const handleCompose = async () => {
    if (!composeForm.receiver || !composeForm.message.trim()) {
      toast.error('Recipient and message are required');
      return;
    }
    try {
      await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_new', receiver: composeForm.receiver, message: composeForm.message, file: composeForm.file }),
      });
      toast.success('Message sent successfully');
      setComposeOpen(false);
      setComposeForm({ receiver: '', message: '', file: '' });
      fetchThreads();
    } catch {
      toast.error('Failed to send message');
    }
  };

  const deleteThread = async (threadId: number) => {
    try {
      await fetch(`/api/admin/messages?thread_id=${threadId}`, { method: 'DELETE' });
      toast.success('Thread deleted');
      if (selectedThread?.message_thread_id === threadId) {
        setSelectedThread(null);
        setCurrentMessages([]);
        setShowMobileThread(false);
      }
      fetchThreads();
    } catch {
      toast.error('Failed to delete thread');
    }
  };

  // ---- SMS Handlers ----

  const sendSMS = async () => {
    if (!smsMessage.trim()) {
      toast.error('Message is required');
      return;
    }
    setSending(true);
    try {
      let recipientType = smsRecipientType;
      let recipientsStr = '';

      if (smsType === 'individual') {
        recipientType = 'individual';
        recipientsStr = selectedRecipients.map(r => r.value).join(',');
      } else if (smsType === 'custom') {
        recipientType = 'custom';
        recipientsStr = phoneNumbers.join(',');
      }

      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          recipient_type: recipientType,
          recipients: recipientsStr,
          message: smsMessage,
        }),
      });
      const data = await res.json();
      toast.success(`SMS logged for ${data.count || 0} recipients`);
      setSmsMessage('');
      setSmsType(null);
      setSelectedRecipients([]);
      setPhoneNumbers([]);
    } catch {
      toast.error('Failed to send SMS');
    }
    setSending(false);
  };

  const sendBillReminder = async () => {
    try {
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_bill_reminder' }),
      });
      const data = await res.json();
      toast.success(data.message || 'Bill reminder sent');
    } catch {
      toast.error('Failed to send bill reminder');
    }
  };

  // ---- Group Message Handlers ----

  const handleCreateGroup = async () => {
    if (!groupForm.title.trim() || !groupForm.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_group',
          title: groupForm.title,
          message: groupForm.message,
          target_group: groupForm.target_group,
          file: groupForm.file,
        }),
      });
      toast.success('Group message sent successfully');
      setCreateGroupOpen(false);
      setGroupForm({ title: '', message: '', target_group: 'students', file: '' });
      fetchGroupMessages();
    } catch {
      toast.error('Failed to send group message');
    }
  };

  const deleteGroup = async (groupId: number) => {
    try {
      await fetch(`/api/admin/messages?action=group&group_id=${groupId}`, { method: 'DELETE' });
      toast.success('Group message deleted');
      if (selectedGroup?.group_message_id === groupId) {
        setSelectedGroup(null);
        setShowMobileGroup(false);
      }
      fetchGroupMessages();
    } catch {
      toast.error('Failed to delete group message');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'thread') {
      await deleteThread(deleteTarget.id);
    } else {
      await deleteGroup(deleteTarget.id);
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  // ---- Helpers ----

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getPartnerInfo = (thread: MessageThread) => {
    const current = 'admin-1';
    const partner = thread.sender === current ? thread.reciever : thread.sender;
    if (!partner) return { name: thread.subject, type: 'Unknown' };
    const parts = partner.split('-');
    const type = parts[0] || 'Unknown';
    return { name: thread.subject, type: type.charAt(0).toUpperCase() + type.slice(1) };
  };

  const filteredRecipients = recipients.filter(r =>
    !selectedRecipients.find(s => s.value === r.value) &&
    r.label.toLowerCase().includes(recipientSearch.toLowerCase())
  ).slice(0, 8);

  const charCount = smsMessage.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  const TARGET_GROUP_MAP: Record<string, string> = {
    students: 'Students', teachers: 'Teachers', parents: 'Parents', admins: 'Admins', all: 'Everyone',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-sm text-slate-500 mt-1">In-app messaging, SMS, and group communications</p>
          </div>
          <Button onClick={() => setComposeOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Message
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading || groupLoading ? (
            <>
              <StatCardSkeleton /><StatCardSkeleton />
              <StatCardSkeleton /><StatCardSkeleton />
            </>
          ) : (
            <>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Conversations</p>
                    <p className="text-xl font-bold text-slate-900">{threads.length}</p>
                    <p className="text-[10px] text-slate-400">In-app threads</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <UsersRound className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Group Messages</p>
                    <p className="text-xl font-bold text-slate-900">{groupMessages.length}</p>
                    <p className="text-[10px] text-slate-400">Broadcast messages</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">SMS Ready</p>
                    <p className="text-xl font-bold text-slate-900">{recipients.length}</p>
                    <p className="text-[10px] text-slate-400">Available contacts</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">Recipients</p>
                    <p className="text-xl font-bold text-slate-900">
                      {recipients.filter(r => r.type === 'student').length} / {recipients.filter(r => r.type === 'parent').length} / {recipients.filter(r => r.type === 'teacher').length}
                    </p>
                    <p className="text-[10px] text-slate-400">Students / Parents / Teachers</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="inapp" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <MessageSquare className="w-4 h-4 mr-1.5 hidden sm:inline" /> In-App
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Smartphone className="w-4 h-4 mr-1.5 hidden sm:inline" /> SMS
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <UsersRound className="w-4 h-4 mr-1.5 hidden sm:inline" /> Group
            </TabsTrigger>
          </TabsList>

          {/* ============ IN-APP MESSAGES TAB ============ */}
          <TabsContent value="inapp">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:h-[calc(100vh-280px)] bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
              {/* Thread List Sidebar */}
              <div className={`lg:col-span-2 border-r border-slate-200 flex flex-col ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                {/* Thread header */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">{threads.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 min-h-[44px] bg-white border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="p-3 space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => <ThreadSkeleton key={i} />)}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center py-16 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Inbox className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                      <p className="text-xs text-slate-400 mt-1">Start a new conversation</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setComposeOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> New Message
                      </Button>
                    </div>
                  ) : (
                    threads.map(thread => {
                      const partner = getPartnerInfo(thread);
                      const threadSearch = search.toLowerCase();
                      if (threadSearch && !partner.name.toLowerCase().includes(threadSearch)) return null;
                      return (
                        <div
                          key={thread.message_thread_id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 relative ${
                            selectedThread?.message_thread_id === thread.message_thread_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          }`}
                          onClick={() => openThread(thread)}
                        >
                          <Avatar className="w-9 h-9 flex-shrink-0">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {getInitials(partner.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">{partner.name}</h3>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{partner.type}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {thread.messages?.[0]?.message || 'No messages'}
                            </p>
                            {thread.last_message_timestamp && (
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {format(new Date(thread.last_message_timestamp), 'dd MMM, HH:mm')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity flex-shrink-0"
                            onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'thread', id: thread.message_thread_id }); setDeleteOpen(true); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </div>

              {/* Message Body */}
              <div className={`lg:col-span-3 flex flex-col ${!showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                {selectedThread ? (
                  <>
                    <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden h-9 w-9 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => setShowMobileThread(false)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {getInitials(getPartnerInfo(selectedThread).name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">{getPartnerInfo(selectedThread).name}</h3>
                        <p className="text-xs text-slate-500">{getPartnerInfo(selectedThread).type}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                        onClick={() => { setDeleteTarget({ type: 'thread', id: selectedThread.message_thread_id }); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4 bg-slate-50" ref={msgContentRef}>
                      <div className="space-y-4">
                        {currentMessages.map((msg, idx) => {
                          const isSent = msg.sender_type === 'admin';
                          const showDate = idx === 0 || (
                            msg.sent_on && currentMessages[idx - 1]?.sent_on &&
                            format(new Date(msg.sent_on), 'yyyy-MM-dd') !== format(new Date(currentMessages[idx - 1].sent_on!), 'yyyy-MM-dd')
                          );
                          return (
                            <div key={msg.message_id}>
                              {showDate && msg.sent_on && (
                                <div className="flex items-center gap-3 my-4">
                                  <Separator className="flex-1" />
                                  <span className="text-[10px] text-slate-400 font-medium bg-white px-2 py-0.5 rounded-full">
                                    {format(new Date(msg.sent_on), 'dd MMM yyyy')}
                                  </span>
                                  <Separator className="flex-1" />
                                </div>
                              )}
                              <div className={`flex gap-3 ${isSent ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                  <AvatarFallback className={`text-xs font-bold ${isSent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {getInitials(isSent ? 'Me' : getPartnerInfo(selectedThread).name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${isSent ? 'text-right' : ''}`}>
                                  <div className={`inline-block rounded-2xl px-3.5 py-2.5 shadow-sm ${isSent ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-white text-slate-900 rounded-bl-md'}`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                  </div>
                                  {msg.file && (
                                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-md text-xs ${isSent ? 'text-emerald-200' : 'text-slate-500'}`}>
                                      <Paperclip className="w-3 h-3" /> {msg.file}
                                    </div>
                                  )}
                                  <MessageStatus sentOn={msg.sent_on} file="" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-slate-200 bg-white">
                      <Textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="min-h-[80px] resize-none mb-2 bg-slate-50 border-slate-200"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 h-10 min-h-[44px] min-w-[44px]">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <div className="flex-1" />
                        <Button
                          onClick={sendReply}
                          disabled={!newMessage.trim() || sendingReply}
                          className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                        >
                          {sendingReply ? <span className="flex items-center gap-1.5"><Circle className="w-3 h-3 animate-spin" /> Sending...</span> : <><Send className="w-4 h-4 mr-1.5" /> Send</>}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Select a conversation</p>
                      <p className="text-slate-400 text-sm mt-1">Choose a thread to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============ SMS TAB ============ */}
          <TabsContent value="sms">
            <Card className="border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-600" /> Send SMS
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Send SMS to students, teachers, and parents</p>
                  </div>
                  <Button
                    onClick={sendBillReminder}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 min-h-[44px]"
                  >
                    <Bell className="w-4 h-4 mr-2" /> Bill Reminder
                  </Button>
                </div>

                {/* SMS Type Selector */}
                {!smsType && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { type: 'individual', icon: Users, title: 'Individual SMS', desc: 'Send to specific person', color: 'emerald' },
                      { type: 'bulk', icon: UsersRound, title: 'Bulk SMS', desc: 'Send to groups', color: 'violet' },
                      { type: 'custom', icon: Phone, title: 'Custom Numbers', desc: 'Enter phone numbers', color: 'amber' },
                    ].map(item => (
                      <Card
                        key={item.type}
                        className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                        onClick={() => setSmsType(item.type)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center mx-auto mb-3`}>
                            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                          </div>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* SMS Form + Phone Preview */}
                {smsType && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    <Card className="border-slate-200/60">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            {smsType === 'individual' ? <Users className="w-5 h-5 text-emerald-600" /> :
                             smsType === 'bulk' ? <UsersRound className="w-5 h-5 text-violet-600" /> :
                             <Phone className="w-5 h-5 text-amber-600" />}
                            {smsType === 'individual' ? 'Individual SMS' :
                             smsType === 'bulk' ? 'Bulk SMS' : 'Custom Numbers'}
                          </h3>
                          <Button size="sm" variant="ghost" className="text-red-500 min-h-[44px]" onClick={() => setSmsType(null)}>
                            <X className="w-4 h-4 mr-1" /> Close
                          </Button>
                        </div>

                        {/* Individual Recipients */}
                        {smsType === 'individual' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Select Recipients</Label>
                            <div className="flex flex-wrap gap-1.5 min-h-[44px] border-2 border-slate-200 rounded-lg p-2 focus-within:border-emerald-400">
                              {selectedRecipients.map(r => (
                                <span key={r.value} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-md text-xs min-h-[32px]">
                                  {r.label}
                                  <button onClick={() => setSelectedRecipients(selectedRecipients.filter(s => s.value !== r.value))} className="ml-1 hover:opacity-70">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              <Input
                                className="border-0 shadow-none focus-visible:ring-0 p-0 h-8 text-sm flex-1 min-w-[120px]"
                                placeholder="Type to search..."
                                value={recipientSearch}
                                onChange={e => setRecipientSearch(e.target.value)}
                              />
                            </div>
                            {recipientSearch.length >= 2 && filteredRecipients.length > 0 && (
                              <div className="border border-slate-200 rounded-lg max-h-[200px] overflow-y-auto">
                                {filteredRecipients.map(r => (
                                  <button
                                    key={r.value}
                                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 text-sm min-h-[44px]"
                                    onClick={() => { setSelectedRecipients([...selectedRecipients, r]); setRecipientSearch(''); }}
                                  >
                                    <span className="font-medium">{r.label}</span>
                                    <span className="text-slate-400 ml-2 text-xs">{r.type}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bulk Group */}
                        {smsType === 'bulk' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Select Group</Label>
                            <Select value={smsRecipientType} onValueChange={setSmsRecipientType}>
                              <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Active Admins</SelectItem>
                                <SelectItem value="parents">All Active Parents</SelectItem>
                                <SelectItem value="teachers">All Active Teachers</SelectItem>
                                <SelectItem value="students">All Active Students</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Custom Numbers */}
                        {smsType === 'custom' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Phone Numbers</Label>
                            <div className="flex flex-wrap gap-1.5 min-h-[44px] border-2 border-slate-200 rounded-lg p-2">
                              {phoneNumbers.map((n, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-md text-xs min-h-[32px]">
                                  {n}
                                  <button onClick={() => setPhoneNumbers(phoneNumbers.filter((_, j) => j !== i))} className="ml-1 hover:opacity-70">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              <Input
                                className="border-0 shadow-none focus-visible:ring-0 p-0 h-8 text-sm flex-1 min-w-[120px]"
                                placeholder="Enter phone and press Enter..."
                                value={phoneNumbers.length > 0 ? '' : ''}
                                onChange={e => {
                                  if (e.target.value.includes(',') || e.target.value.includes('\n')) {
                                    const nums = e.target.value.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
                                    setPhoneNumbers([...phoneNumbers, ...nums]);
                                  }
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val && !phoneNumbers.includes(val)) {
                                      setPhoneNumbers([...phoneNumbers, val]);
                                    }
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">Press Enter or comma to add each number</p>
                          </div>
                        )}

                        {/* Message */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Message</Label>
                          <Textarea
                            value={smsMessage}
                            onChange={e => setSmsMessage(e.target.value)}
                            placeholder="Type your SMS message..."
                            rows={4}
                            className="resize-none bg-slate-50 border-slate-200"
                          />
                          <div className="flex justify-between text-xs text-slate-400">
                            <span><span className="font-semibold text-slate-600">{charCount}</span>/160 characters</span>
                            <span><span className="font-semibold text-slate-600">{smsCount}</span> SMS</span>
                          </div>
                        </div>

                        <Button
                          onClick={sendSMS}
                          disabled={sending || !smsMessage.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm min-h-[44px]"
                        >
                          {sending ? <span className="flex items-center gap-1.5"><Circle className="w-3 h-3 animate-spin" /> Sending...</span> : <><Send className="w-4 h-4 mr-2" /> Send SMS</>}
                        </Button>
                      </CardContent>
                    </Card>

                    <PhoneSimulator message={smsMessage} />
                  </div>
                )}

                {/* SMS Info */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> SMS Information
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1.5">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> SMS sent directly to phone numbers</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> 160 characters per SMS</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Delivery status available in SMS logs</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> Charges may apply based on SMS gateway</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ GROUP MESSAGES TAB ============ */}
          <TabsContent value="group">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:h-[calc(100vh-280px)] bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
              {/* Group List */}
              <div className={`lg:col-span-2 border-r border-slate-200 flex flex-col ${showMobileGroup ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Group Messages</h2>
                    <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-700">{groupMessages.length}</Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setCreateGroupOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> New
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {groupLoading ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                  ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center py-16 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <UsersRound className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No group messages</p>
                      <p className="text-xs text-slate-400 mt-1">Broadcast to students, parents, or teachers</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 min-h-[44px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setCreateGroupOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Create Group Message
                      </Button>
                    </div>
                  ) : (
                    groupMessages.map(group => (
                      <div
                        key={group.group_message_id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                          selectedGroup?.group_message_id === group.group_message_id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                        }`}
                        onClick={() => { setSelectedGroup(group); setShowMobileGroup(true); }}
                      >
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <UsersRound className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">{group.title}</h3>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {TARGET_GROUP_MAP[group.target_group] || group.target_group}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{group.message}</p>
                          {group.send_date && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {format(new Date(group.send_date), 'dd MMM, HH:mm')}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Badge className="text-[9px] px-1 py-0" style={{
                              backgroundColor: group.status === 'sent' ? '#dcfce7' : group.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: group.status === 'sent' ? '#15803d' : group.status === 'pending' ? '#b45309' : '#dc2626',
                            }}>
                              {group.status}
                            </Badge>
                            {group.group_message_threads && (
                              <span className="text-[9px] text-slate-400">
                                {group.group_message_threads.length} recipients
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-500 flex-shrink-0 min-h-[36px] min-w-[36px]"
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: group.group_message_id }); setDeleteOpen(true); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Group Message Detail */}
              <div className={`lg:col-span-3 flex flex-col ${!showMobileGroup ? 'hidden lg:flex' : 'flex'}`}>
                {selectedGroup ? (
                  <>
                    <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden h-9 w-9 p-0 min-h-[44px] min-w-[44px]"
                        onClick={() => setShowMobileGroup(false)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                        <UsersRound className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">{selectedGroup.title}</h3>
                        <p className="text-xs text-slate-500">
                          {TARGET_GROUP_MAP[selectedGroup.target_group] || selectedGroup.target_group}
                          {selectedGroup.send_date && ` \u00b7 ${format(new Date(selectedGroup.send_date), 'dd MMM yyyy')}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                        onClick={() => { setDeleteTarget({ type: 'group', id: selectedGroup.group_message_id }); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4 bg-slate-50">
                      <div className="max-w-2xl mx-auto space-y-4">
                        {/* Message content */}
                        <Card className="border-slate-200/60">
                          <CardContent className="p-4">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedGroup.message}</p>
                            {selectedGroup.file && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                                <Paperclip className="w-3.5 h-3.5" /> {selectedGroup.file}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Recipient list */}
                        {selectedGroup.group_message_threads && selectedGroup.group_message_threads.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Recipients</h4>
                            {selectedGroup.group_message_threads.map((thread, idx) => (
                              <Card key={idx} className="border-slate-200/60">
                                <CardContent className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="w-7 h-7">
                                      <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                        {thread.recipient_type.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-slate-700">{thread.recipient_type.replace(/_/g, ' ')}</p>
                                      {thread.read_at && (
                                        <p className="text-[10px] text-slate-400">Read {format(new Date(thread.read_at), 'dd MMM, HH:mm')}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={`text-[10px] ${
                                    thread.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                                    thread.status === 'delivered' ? 'bg-sky-100 text-sky-700' :
                                    thread.status === 'read' ? 'bg-violet-100 text-violet-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {thread.status}
                                  </Badge>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <UsersRound className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Select a group message</p>
                      <p className="text-slate-400 text-sm mt-1">View details and delivery status</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              New Message
            </DialogTitle>
            <DialogDescription>Send a message to a student, parent, or teacher</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Recipient <span className="text-red-500">*</span></Label>
              <Select value={composeForm.receiver} onValueChange={v => setComposeForm({ ...composeForm, receiver: v })}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {recipients.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label} <span className="text-slate-400 ml-1">({r.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Message <span className="text-red-500">*</span></Label>
              <Textarea
                value={composeForm.message}
                onChange={e => setComposeForm({ ...composeForm, message: e.target.value })}
                placeholder="Type your message..."
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Attachment (optional)</Label>
              <Input
                value={composeForm.file}
                onChange={e => setComposeForm({ ...composeForm, file: e.target.value })}
                placeholder="File URL or name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setComposeOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleCompose} disabled={!composeForm.receiver || !composeForm.message.trim()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <Send className="w-4 h-4 mr-1.5" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Message Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <UsersRound className="w-4 h-4 text-violet-600" />
              </div>
              New Group Message
            </DialogTitle>
            <DialogDescription>Broadcast a message to a group of recipients</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Title <span className="text-red-500">*</span></Label>
              <Input
                value={groupForm.title}
                onChange={e => setGroupForm({ ...groupForm, title: e.target.value })}
                placeholder="e.g., Parent Meeting Notice"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Target Group</Label>
              <Select value={groupForm.target_group} onValueChange={v => setGroupForm({ ...groupForm, target_group: v })}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                  <SelectItem value="all">Everyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium">Message <span className="text-red-500">*</span></Label>
              <Textarea
                value={groupForm.message}
                onChange={e => setGroupForm({ ...groupForm, message: e.target.value })}
                placeholder="Type your group message..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)} className="min-h-[44px]">Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!groupForm.title.trim() || !groupForm.message.trim()} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
              <SendHorizonal className="w-4 h-4 mr-1.5" /> Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete {deleteTarget?.type === 'thread' ? 'Conversation' : 'Group Message'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type === 'thread' ? 'conversation and all its messages' : 'group message'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 min-h-[44px]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
