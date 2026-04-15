'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Smartphone, Users, Phone, X, Clock, Trash2, Bell, UserPlus,
  CheckCircle2, Circle, UsersRound, ChevronRight, Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
// Phone Simulator Component (matches CI3 message.php)
// ============================================================
function PhoneSimulator({ message }: { message: string }) {
  return (
    <div className="hidden lg:flex flex-col items-center">
      <div className="w-[260px] h-[520px] bg-slate-900 rounded-[32px] p-2.5 shadow-2xl">
        <div className="w-full h-full bg-slate-100 rounded-[24px] overflow-hidden flex flex-col">
          {/* Notch */}
          <div className="h-6 bg-slate-900 rounded-b-2xl mx-auto w-28 flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-700 rounded-full" />
          </div>
          {/* Status bar */}
          <div className="px-4 py-1 flex justify-between text-[9px] text-slate-500">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5" />
              <span>100%</span>
            </span>
          </div>
          {/* Header */}
          <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">School SMS</p>
              <p className="text-[9px] text-slate-400">SMS Preview</p>
            </div>
          </div>
          {/* Messages */}
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
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState('inapp'); // inapp | sms
  const msgContentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { fetchThreads(); }, [fetchThreads]);
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
      toast({ title: 'Error', variant: 'destructive' });
    }
    setSendingReply(false);
  };

  const handleCompose = async () => {
    if (!composeForm.receiver || !composeForm.message.trim()) {
      toast({ title: 'Error', description: 'Recipient and message required', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_new', receiver: composeForm.receiver, message: composeForm.message, file: composeForm.file }),
      });
      toast({ title: 'Success', description: 'Message sent' });
      setComposeOpen(false);
      setComposeForm({ receiver: '', message: '', file: '' });
      fetchThreads();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const deleteThread = async (threadId: number) => {
    try {
      await fetch(`/api/admin/messages?thread_id=${threadId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Thread deleted' });
      if (selectedThread?.message_thread_id === threadId) {
        setSelectedThread(null);
        setCurrentMessages([]);
        setShowMobileThread(false);
      }
      fetchThreads();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // ---- SMS Handlers ----

  const sendSMS = async () => {
    if (!smsMessage.trim()) {
      toast({ title: 'Error', description: 'Message is required', variant: 'destructive' });
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
      toast({
        title: 'SMS Sent',
        description: `SMS logged for ${data.count || 0} recipients`,
      });
      setSmsMessage('');
      setSmsType(null);
      setSelectedRecipients([]);
      setPhoneNumbers([]);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
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
      toast({ title: 'Bill Reminder', description: data.message });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // ---- Group Message Handlers ----

  const handleCreateGroup = async () => {
    if (!groupForm.title.trim() || !groupForm.message.trim()) {
      toast({ title: 'Error', description: 'Title and message required', variant: 'destructive' });
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
      toast({ title: 'Success', description: 'Group message sent' });
      setCreateGroupOpen(false);
      setGroupForm({ title: '', message: '', target_group: 'students', file: '' });
      fetchGroupMessages();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const deleteGroup = async (groupId: number) => {
    try {
      await fetch(`/api/admin/messages?action=group&group_id=${groupId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Group message deleted' });
      if (selectedGroup?.group_message_id === groupId) {
        setSelectedGroup(null);
        setShowMobileGroup(false);
      }
      fetchGroupMessages();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
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

  const formatMessageDate = (sentOn: string | null) => {
    if (!sentOn) return '';
    const d = new Date(sentOn);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return format(d, 'HH:mm');
    return format(d, 'dd MMM');
  };

  const TARGET_GROUP_MAP: Record<string, string> = {
    students: 'Students', teachers: 'Teachers', parents: 'Parents', admins: 'Admins', all: 'Everyone',
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-sm text-slate-500">SMS messaging and in-app conversations</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full">
            <TabsTrigger value="inapp" className="flex-1 gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4" /> In-App Messages
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex-1 gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Smartphone className="w-4 h-4" /> SMS Messages
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1 gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <UsersRound className="w-4 h-4" /> Group Messages
            </TabsTrigger>
          </TabsList>

          {/* ============ IN-APP MESSAGES TAB ============ */}
          <TabsContent value="inapp" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:h-[calc(100vh-280px)] bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
              {/* Thread List Sidebar */}
              <div className={`lg:col-span-2 border-r border-slate-200 flex flex-col ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white p-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Conversations
                  </h2>
                  <Button
                    className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg"
                    onClick={() => setComposeOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Message
                  </Button>
                </div>

                <div className="p-3 border-b border-slate-200 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search messages..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 min-h-[40px]"
                  />
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center py-16 px-4">
                      <Inbox className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-500">No conversations yet</p>
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
                            selectedThread?.message_thread_id === thread.message_thread_id ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''
                          }`}
                          onClick={() => openThread(thread)}
                        >
                          <Avatar className="w-9 h-9 flex-shrink-0">
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-semibold">
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
                            className="h-7 w-7 p-0 text-red-400 opacity-0 hover:opacity-100 transition-opacity flex-shrink-0"
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
                    <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white p-4 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden h-8 w-8 p-0 text-white hover:bg-white/20"
                        onClick={() => setShowMobileThread(false)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="w-9 h-9 border-2 border-white/30">
                        <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                          {getInitials(getPartnerInfo(selectedThread).name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{getPartnerInfo(selectedThread).name}</h3>
                        <p className="text-xs text-white/80">{getPartnerInfo(selectedThread).type}</p>
                      </div>
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
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {format(new Date(msg.sent_on), 'dd MMM yyyy')}
                                  </span>
                                  <Separator className="flex-1" />
                                </div>
                              )}
                              <div className={`flex gap-3 ${isSent ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                  <AvatarFallback className={`text-xs font-bold ${isSent ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {getInitials(isSent ? 'Admin' : getPartnerInfo(selectedThread).name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${isSent ? 'text-right' : ''}`}>
                                  <div className={`inline-block rounded-xl p-3 shadow-sm ${isSent ? 'bg-violet-600 text-white' : 'bg-white text-slate-900'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                  </div>
                                  {msg.file && (
                                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-md text-xs ${isSent ? 'text-violet-200' : 'text-slate-500'}`}>
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
                        className="min-h-[80px] resize-none mb-2"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <div className="flex-1" />
                        <Button
                          onClick={sendReply}
                          disabled={!newMessage.trim() || sendingReply}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Send className="w-4 h-4 mr-1" /> {sendingReply ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Select a conversation to start messaging</p>
                      <p className="text-slate-400 text-sm mt-1">Or click &quot;New Message&quot; to start one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============ SMS TAB ============ */}
          <TabsContent value="sms" className="mt-4">
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
                    className="bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                  >
                    <Bell className="w-4 h-4 mr-2" /> Send Bill Reminder
                  </Button>
                </div>

                {/* SMS Type Selector */}
                {!smsType && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { type: 'individual', icon: Users, title: 'Individual SMS', desc: 'Send to specific person' },
                      { type: 'bulk', icon: UsersRound, title: 'Bulk SMS', desc: 'Send to groups' },
                      { type: 'custom', icon: Phone, title: 'Custom Numbers', desc: 'Enter phone numbers' },
                    ].map(item => (
                      <Card
                        key={item.type}
                        className="border-2 border-slate-200 hover:border-emerald-500 hover:shadow-lg cursor-pointer transition-all hover:-translate-y-0.5"
                        onClick={() => setSmsType(item.type)}
                      >
                        <CardContent className="p-6 text-center">
                          <item.icon className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
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
                            {smsType === 'individual' ? <Users className="w-5 h-5" /> :
                             smsType === 'bulk' ? <UsersRound className="w-5 h-5" /> :
                             <Phone className="w-5 h-5" />}
                            {smsType === 'individual' ? 'Individual SMS' :
                             smsType === 'bulk' ? 'Bulk SMS' : 'Custom Numbers'}
                          </h3>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setSmsType(null)}>
                            <X className="w-4 h-4" /> Close
                          </Button>
                        </div>

                        {/* Individual Recipients */}
                        {smsType === 'individual' && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Select Recipients</Label>
                            <div className="flex flex-wrap gap-1.5 min-h-[42px] border-2 border-slate-200 rounded-lg p-1.5 focus-within:border-emerald-500">
                              {selectedRecipients.map(r => (
                                <span key={r.value} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-md text-xs">
                                  {r.label} <small>({r.type})</small>
                                  <button onClick={() => setSelectedRecipients(selectedRecipients.filter(s => s.value !== r.value))} className="ml-1 hover:opacity-70">×</button>
                                </span>
                              ))}
                              <Input
                                className="border-0 shadow-none focus-visible:ring-0 p-0 h-7 text-sm flex-1 min-w-[120px]"
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
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 text-sm"
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
                            <Label className="text-sm font-semibold">Select Group</Label>
                            <Select value={smsRecipientType} onValueChange={setSmsRecipientType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Label className="text-sm font-semibold">Phone Numbers</Label>
                            <div className="flex flex-wrap gap-1.5 min-h-[42px] border-2 border-slate-200 rounded-lg p-1.5">
                              {phoneNumbers.map((n, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-md text-xs">
                                  {n}
                                  <button onClick={() => setPhoneNumbers(phoneNumbers.filter((_, j) => j !== i))} className="ml-1 hover:opacity-70">×</button>
                                </span>
                              ))}
                              <Input
                                className="border-0 shadow-none focus-visible:ring-0 p-0 h-7 text-sm flex-1 min-w-[120px]"
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
                          <Label className="text-sm font-semibold flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" /> Message
                          </Label>
                          <Textarea
                            value={smsMessage}
                            onChange={e => setSmsMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={4}
                            className="resize-none"
                          />
                          <div className="flex justify-between text-xs text-slate-400">
                            <span><span className="font-semibold text-slate-600">{charCount}</span>/160 characters</span>
                            <span><span className="font-semibold text-slate-600">{smsCount}</span> SMS</span>
                          </div>
                        </div>

                        <Button
                          onClick={sendSMS}
                          disabled={sending || !smsMessage.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md py-5"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sending ? 'Sending...' : 'Send SMS'}
                        </Button>
                      </CardContent>
                    </Card>

                    <PhoneSimulator message={smsMessage} />
                  </div>
                )}

                {/* SMS Info */}
                <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> SMS Information
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                    <li>SMS sent directly to phone numbers</li>
                    <li>Charges may apply based on SMS gateway</li>
                    <li>160 characters per SMS</li>
                    <li>Delivery status available in SMS logs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ GROUP MESSAGES TAB ============ */}
          <TabsContent value="group" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:h-[calc(100vh-280px)] bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
              {/* Group List Sidebar */}
              <div className={`lg:col-span-2 border-r border-slate-200 flex flex-col ${showMobileGroup ? 'hidden lg:flex' : 'flex'}`}>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <UsersRound className="w-5 h-5" /> Group Messages
                  </h2>
                  <Button
                    className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg"
                    onClick={() => setCreateGroupOpen(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> New Group Message
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {groupLoading ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                    </div>
                  ) : groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center py-16 px-4">
                      <UsersRound className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-500">No group messages yet</p>
                      <p className="text-xs text-slate-400 mt-1">Create one to broadcast to a group</p>
                    </div>
                  ) : (
                    groupMessages.map(gm => (
                      <div
                        key={gm.group_message_id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-amber-50 transition-colors border-b border-slate-100 relative ${
                          selectedGroup?.group_message_id === gm.group_message_id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                        }`}
                        onClick={() => { setSelectedGroup(gm); setShowMobileGroup(true); }}
                      >
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <UsersRound className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">{gm.title}</h3>
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 shrink-0">
                              {TARGET_GROUP_MAP[gm.target_group] || gm.target_group}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{gm.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {gm.send_date && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {format(new Date(gm.send_date), 'dd MMM, HH:mm')}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {gm.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 opacity-0 hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: gm.group_message_id }); setDeleteOpen(true); }}
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
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden h-8 w-8 p-0 text-white hover:bg-white/20"
                        onClick={() => setShowMobileGroup(false)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <UsersRound className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{selectedGroup.title}</h3>
                        <p className="text-xs text-white/80">
                          To: {TARGET_GROUP_MAP[selectedGroup.target_group] || selectedGroup.target_group}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedGroup.status === 'sent' && (
                          <Badge className="bg-green-400/20 text-green-100 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                          </Badge>
                        )}
                        {selectedGroup.file && (
                          <Badge className="bg-white/20 text-white text-xs gap-1">
                            <Paperclip className="w-3 h-3" /> File
                          </Badge>
                        )}
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-4 bg-slate-50">
                      <div className="space-y-4">
                        {/* Message bubble */}
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">Ad</AvatarFallback>
                          </Avatar>
                          <div className="max-w-[80%]">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                              <p className="text-sm font-medium text-slate-900 mb-1">Admin</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedGroup.message}</p>
                            </div>
                            {selectedGroup.file && (
                              <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-md text-xs text-amber-700 bg-amber-50">
                                <Paperclip className="w-3 h-3" /> {selectedGroup.file}
                              </div>
                            )}
                            {selectedGroup.send_date && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {format(new Date(selectedGroup.send_date), 'dd MMM yyyy, HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Recipient Threads */}
                        {selectedGroup.group_message_threads && selectedGroup.group_message_threads.length > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                Delivery Status ({selectedGroup.group_message_threads.length} recipients)
                              </span>
                            </div>
                            {selectedGroup.group_message_threads.map((thread, i) => (
                              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white text-xs">
                                {thread.status === 'read' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : thread.status === 'delivered' ? (
                                  <Circle className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-slate-300" />
                                )}
                                <span className="text-slate-600">{thread.recipient_type} #{thread.recipient_id}</span>
                                <Badge variant="outline" className={`text-[10px] capitalize ml-auto ${
                                  thread.status === 'read' ? 'border-emerald-200 text-emerald-600' :
                                  thread.status === 'delivered' ? 'border-blue-200 text-blue-600' :
                                  'border-slate-200 text-slate-400'
                                }`}>
                                  {thread.status}
                                </Badge>
                                {thread.sent_at && (
                                  <span className="text-[10px] text-slate-400">
                                    {format(new Date(thread.sent_at), 'dd MMM')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <UsersRound className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Select a group message to view details</p>
                      <p className="text-slate-400 text-sm mt-1">Or click &quot;New Group Message&quot; to create one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ Compose New Message Dialog ============ */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" /> Write New Message
            </DialogTitle>
            <DialogDescription>Compose a new message to a recipient</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Users className="w-4 h-4" /> Recipient
              </Label>
              <Select value={composeForm.receiver} onValueChange={v => setComposeForm({ ...composeForm, receiver: v })}>
                <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {recipients.length > 0 && (
                    <>
                      <SelectItem value="__students_header" disabled className="text-xs font-bold text-slate-500">── Students ──</SelectItem>
                      {recipients.filter(r => r.type === 'Student').map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                      <SelectItem value="__teachers_header" disabled className="text-xs font-bold text-slate-500">── Teachers ──</SelectItem>
                      {recipients.filter(r => r.type === 'Teacher').map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                      <SelectItem value="__parents_header" disabled className="text-xs font-bold text-slate-500">── Parents ──</SelectItem>
                      {recipients.filter(r => r.type === 'Parent').map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> Message
              </Label>
              <Textarea
                value={composeForm.message}
                onChange={e => setComposeForm({ ...composeForm, message: e.target.value })}
                placeholder="Write your message..."
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> Attachment
              </Label>
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="file:border-dashed file:border-slate-300 file:rounded-lg file:px-4 file:py-2 file:text-sm" />
              <p className="text-xs text-slate-400">(optional, max 4MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCompose}
              disabled={!composeForm.receiver || !composeForm.message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" /> Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Create Group Message Dialog ============ */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-amber-600" /> New Group Message
            </DialogTitle>
            <DialogDescription>Broadcast a message to a group</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title *</Label>
              <Input
                value={groupForm.title}
                onChange={e => setGroupForm({ ...groupForm, title: e.target.value })}
                placeholder="Message title / subject"
                className="min-h-[44px]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Users className="w-4 h-4" /> Target Group *
              </Label>
              <Select value={groupForm.target_group} onValueChange={v => setGroupForm({ ...groupForm, target_group: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">All Active Students</SelectItem>
                  <SelectItem value="teachers">All Active Teachers</SelectItem>
                  <SelectItem value="parents">All Active Parents</SelectItem>
                  <SelectItem value="admins">All Active Admins</SelectItem>
                  <SelectItem value="all">Everyone (All)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> Message *
              </Label>
              <Textarea
                value={groupForm.message}
                onChange={e => setGroupForm({ ...groupForm, message: e.target.value })}
                placeholder="Write your group message..."
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> Attachment
              </Label>
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="file:border-dashed file:border-slate-300 file:rounded-lg file:px-4 file:py-2 file:text-sm" />
              <p className="text-xs text-slate-400">(optional, max 4MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupForm.title.trim() || !groupForm.message.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Send className="w-4 h-4 mr-2" /> Send Group Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Delete Confirmation ============ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'thread' ? 'Conversation' : 'Group Message'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type === 'thread' ? 'conversation and all its messages' : 'group message'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
