'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertTriangle, AlertCircle, Clock, DollarSign, Shield, CreditCard,
  TrendingDown, FileText, Wallet, Bell, Info,
} from 'lucide-react';

interface Alert {
  type: string;
  severity: string;
  title: string;
  description: string;
  amount?: number;
  studentName?: string;
  studentCode?: string;
  reference?: string;
  days?: number;
  method?: string;
  requestType?: string;
  daysPending?: number;
  breakdown?: Record<string, number>;
}

interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  highBalance: number;
  unusual: number;
  shortfall: number;
  pendingApprovals: number;
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

const severityConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
  high: { label: 'High', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: Info },
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Bell },
};

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  overdue: { label: 'Overdue', icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  high_balance: { label: 'High Balance', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  unusual: { label: 'Unusual Txn', icon: TrendingDown, color: 'text-violet-600', bg: 'bg-violet-50' },
  shortfall: { label: 'Shortfall', icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
  pending_approvals: { label: 'Pending Approval', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function FinancialAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeType !== 'all' ? `?type=${activeType}` : '';
      const res = await fetch(`/api/admin/financial-alerts${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSummary(data.summary || null);
    } catch { toast.error('Failed to load alerts'); } finally { setLoading(false); }
  }, [activeType]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            Financial Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">Monitor overdue payments, high balances, and unusual activity</p>
        </div>

        {/* Severity Summary */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: summary.total, color: 'from-slate-500 to-slate-600', icon: Bell },
              { label: 'Critical', value: summary.critical, color: 'from-red-500 to-rose-500', icon: AlertCircle },
              { label: 'High', value: summary.high, color: 'from-amber-500 to-orange-500', icon: AlertTriangle },
              { label: 'Medium', value: summary.medium, color: 'from-sky-500 to-cyan-500', icon: Info },
              { label: 'Low', value: summary.low, color: 'from-slate-400 to-slate-500', icon: Bell },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-1`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Type Filter Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-1.5"><Bell className="w-3.5 h-3.5" />All</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5"><Clock className="w-3.5 h-3.5" />Overdue</TabsTrigger>
            <TabsTrigger value="high_balance" className="gap-1.5"><Wallet className="w-3.5 h-3.5" />High Balance</TabsTrigger>
            <TabsTrigger value="unusual" className="gap-1.5"><TrendingDown className="w-3.5 h-3.5" />Unusual</TabsTrigger>
            <TabsTrigger value="shortfall" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" />Shortfall</TabsTrigger>
            <TabsTrigger value="pending_approvals" className="gap-1.5"><Shield className="w-3.5 h-3.5" />Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeType} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[700px]">
                  {loading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No alerts found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {alerts.map((alert, i) => {
                        const sevCfg = severityConfig[alert.severity] || severityConfig.medium;
                        const typeCfg = typeConfig[alert.type] || typeConfig.overdue;
                        const SevIcon = sevCfg.icon;
                        const TypeIcon = typeCfg.icon;
                        return (
                          <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg ${sevCfg.bg} border flex items-center justify-center flex-shrink-0`}>
                                <SevIcon className={`w-4 h-4 ${sevCfg.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                                  <Badge variant="outline" className={`${sevCfg.bg} ${sevCfg.color} text-[10px]`}>{sevCfg.label}</Badge>
                                  <Badge variant="outline" className={`${typeCfg.bg} ${typeCfg.color} text-[10px]`}>{typeCfg.label}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{alert.description}</p>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {alert.studentName && (
                                    <span className="text-[10px] text-slate-400">
                                      Student: <span className="font-medium text-slate-600">{alert.studentName}</span>
                                      {alert.studentCode && <span className="font-mono ml-1">({alert.studentCode})</span>}
                                    </span>
                                  )}
                                  {alert.amount !== undefined && (
                                    <span className="text-[10px] font-mono font-semibold text-red-600">{fmt(alert.amount)}</span>
                                  )}
                                  {alert.days !== undefined && (
                                    <span className="text-[10px] text-slate-400">{alert.days} days</span>
                                  )}
                                  {alert.daysPending !== undefined && (
                                    <span className="text-[10px] text-slate-400">{alert.daysPending} days pending</span>
                                  )}
                                  {alert.method && (
                                    <span className="text-[10px] text-slate-400">Method: {alert.method}</span>
                                  )}
                                  {alert.reference && (
                                    <span className="text-[10px] font-mono text-slate-400">{alert.reference}</span>
                                  )}
                                </div>
                                {alert.breakdown && (
                                  <div className="flex gap-2 mt-2">
                                    {Object.entries(alert.breakdown).map(([key, val]) => (
                                      val > 0 ? <Badge key={key} variant="outline" className="text-[10px]">{key}: {fmt(val)}</Badge> : null
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
