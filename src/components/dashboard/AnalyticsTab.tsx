import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Loader2, Users, BookOpen, Clock, FileCheck, Sparkles, LayoutDashboard } from "lucide-react";
import { DataAnalysisTab } from "./DataAnalysisTab";
import { cn } from "@/lib/utils";

export function AnalyticsTab() {
    const [mode, setMode] = useState<'overview' | 'ai'>('overview');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['analytics-stats'],
        queryFn: async () => {
            await new Promise(r => setTimeout(r, 1000));
            return {
                performanceTrend: [
                    { name: 'Jan', avg: 65 }, { name: 'Feb', avg: 72 }, { name: 'Mar', avg: 68 },
                    { name: 'Apr', avg: 75 }, { name: 'May', avg: 82 }, { name: 'Jun', avg: 85 }
                ],
                attendanceDist: [
                    { name: 'Present', value: 85, color: '#10B981' },
                    { name: 'Absent', value: 10, color: '#EF4444' },
                    { name: 'Late', value: 5, color: '#F59E0B' }
                ],
                topicMastery: [
                    { subject: 'Math', score: 88 },
                    { subject: 'Physics', score: 76 },
                    { subject: 'Chemistry', score: 82 },
                    { subject: 'Biology', score: 90 },
                    { subject: 'English', score: 95 }
                ],
                studentEngagement: [
                    { day: 'Mon', active: 45 }, { day: 'Tue', active: 52 }, { day: 'Wed', active: 48 },
                    { day: 'Thu', active: 60 }, { day: 'Fri', active: 55 }
                ],
                overview: { totalStudents: 120, completedLessons: 45, totalHours: 128, assignmentsGraded: 350 }
            };
        }
    });

    const overviewCards = [
        { label: 'Total Entities', value: stats?.overview.totalStudents, icon: Users, color: 'indigo', glow: 'shadow-indigo-500/10', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
        { label: 'Lessons Deployed', value: stats?.overview.completedLessons, icon: BookOpen, color: 'emerald', glow: 'shadow-emerald-500/10', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
        { label: 'Teaching Hours', value: `${stats?.overview.totalHours}h`, icon: Clock, color: 'amber', glow: 'shadow-amber-500/10', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
        { label: 'Graded Artifacts', value: stats?.overview.assignmentsGraded, icon: FileCheck, color: 'blue', glow: 'shadow-blue-500/10', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
    ];

    const chartTooltipStyle = {
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        color: '#0f172a',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        fontSize: '11px',
        fontWeight: 900,
        textTransform: 'uppercase' as const,
        padding: '12px'
    };

    if (isLoading) return (
        <div className="flex flex-col h-[400px] items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 animate-pulse">Synchronizing Intelligence...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="text-left space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Analytics Command
                    </h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        Institutional Performance Metrics & AI Insights
                    </p>
                </div>

                <div className="flex p-1.5 bg-white rounded-[1.2rem] w-fit border border-slate-100 shadow-xl shadow-slate-200/40">
                    <button
                        onClick={() => setMode('overview')}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'overview'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-slate-600'
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Overview
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'ai'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-slate-600'
                        )}
                    >
                        <Sparkles className="w-4 h-4" /> AI Analysis
                    </button>
                </div>
            </div>

            {mode === 'ai' ? (
                <DataAnalysisTab />
            ) : (
                <div className="space-y-10">
                    {/* Overview Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {overviewCards.map((card, i) => (
                            <Card key={i} className={cn(
                                "border border-slate-100 bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden",
                                card.glow
                            )}>
                                <CardContent className="p-8 flex items-center gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                                        card.bg,
                                        card.border
                                    )}>
                                        <card.icon className={cn("w-7 h-7", card.text)} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                                        <h3 className={cn("text-3xl font-black mt-1 tracking-tight", card.text)}>{card.value}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <CardHeader className="px-10 pt-10 pb-0">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Performance Trend</CardTitle>
                                <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 uppercase">Academic Trajectory</p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats?.performanceTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                            <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                                            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', strokeWidth: 2, r: 6, stroke: '#fff' }} activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <CardHeader className="px-10 pt-10 pb-0">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject Intelligence</CardTitle>
                                <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 uppercase">Domain Mastery Index</p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.topicMastery} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }} width={80} />
                                            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="border border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <CardHeader className="px-10 pt-10 pb-0">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Attendance Status</CardTitle>
                                <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 uppercase">Presence Distribution</p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="h-[240px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats?.attendanceDist} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" strokeWidth={0}>
                                                {stats?.attendanceDist.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={chartTooltipStyle} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-6 mt-4">
                                    {stats?.attendanceDist.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-100 bg-white rounded-[2.5rem] shadow-sm overflow-hidden lg:col-span-2">
                            <CardHeader className="px-10 pt-10 pb-0">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Engagement Insights</CardTitle>
                                <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 uppercase">Weekly Activity Index</p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="h-[240px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.studentEngagement}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="active" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={48} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

