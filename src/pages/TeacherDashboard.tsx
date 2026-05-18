import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Brain as BrainIcon,
  ClipboardCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ScrollText,
  TrendingUp as TrendingUpIcon,
  Sparkles,
  Presentation
} from "lucide-react";
// INTEGRITY_CHECK: STABILITY_V2_SYNC_1778746132961_FIXED_TRENDING_UP
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { AssignmentsTab } from "@/components/dashboard/AssignmentsTab";
import { LessonsPage } from "@/features/lessons/pages/LessonsPage";
import { QuizGeneratorTab } from "@/components/dashboard/QuizGeneratorTab";
import { TeachingMaterialTab } from "@/components/dashboard/TeachingMaterialTab";
import { AttendanceTab } from "@/components/dashboard/AttendanceTab";
import { QuestionPaperTab } from "@/components/dashboard/QuestionPaperTab";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { StudentsTab } from "@/components/dashboard/StudentsTab";
import { AIAssistantTab } from "@/components/dashboard/AIAssistantTab";
import { AILessonPlanGeneratorTab } from "@/components/dashboard/AILessonPlanGeneratorTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { PPTGeneratorTab } from "@/components/dashboard/PPTGeneratorTab";
import { CalendarTab } from "@/components/dashboard/CalendarTab";
import { DataAnalysisTab } from "@/components/dashboard/DataAnalysisTab";
import { LessonSummarizerTab } from "@/components/dashboard/LessonSummarizerTab";

// ── TAB REGISTRY ──────────────────────────────────────────────────────────────
// This is the single source of truth. Every sidebar link maps to a tab id here.
const TABS = [
  { id: "dashboard",    label: "Overview",          icon: LayoutDashboard },
  { id: "generator",   label: "AI Lesson Planner",  icon: BrainIcon },
  { id: "library",     label: "Lesson Library",      icon: BookOpen },
  { id: "summarizer",  label: "Summarizer",          icon: FileText },
  { id: "ppt",         label: "PPT Generator",       icon: Presentation },
  { id: "assignments", label: "Assignments",          icon: FileText },
  { id: "exams",       label: "Examinations",         icon: ScrollText },
  { id: "attendance",  label: "Attendance",           icon: CheckCircle2 },
  { id: "students",    label: "Students",             icon: Users },
  { id: "messages",    label: "Messages",             icon: Sparkles },
  { id: "analytics",   label: "Analytics",            icon: BarChart3 },
  { id: "materials",   label: "Materials",            icon: BookOpen },
  { id: "quiz",        label: "Quiz Generator",       icon: BrainIcon },
  { id: "calendar",    label: "Calendar",             icon: ClipboardCheck },
  { id: "data",        label: "Data Analysis",        icon: TrendingUpIcon },
];

const VISIBLE_TABS = TABS.filter(t => ["dashboard", "generator", "library", "summarizer", "ppt"].includes(t.id));

const TeacherDashboard = () => {
  // ── Use URL search params so tab survives navigation & refresh ──────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(urlTab);

  // Sync tab from URL params (when sidebar links update ?tab=xxx)
  useEffect(() => {
    const tab = searchParams.get("tab") || "dashboard";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (id: string) => {
    setSearchParams({ tab: id });
    setActiveTab(id);
  };

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data?.data || res.data;
    }
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const res = await api.get('/v2/lessons');
      return res.data || [];
    }
  });

  const stats = [
    { label: "Total Students",   value: dashboardStats?.totalStudents  ?? "0",           change: "+12% Periodicity",    icon: Users,      iconColor: "text-indigo-600" },
    { label: "Plans Created",    value: dashboardStats?.lessonsCreated ?? "0",           change: "+5 Academic Cycle",   icon: BookOpen,   iconColor: "text-emerald-600" },
    { label: "Avg. Performance", value: (dashboardStats?.avgPerformance ?? "78") + "%",  change: "+3% Institutional",   icon: BarChart3,  iconColor: "text-blue-600" },
    { label: "Attendance Rate",  value: (dashboardStats?.attendanceRate ?? "95") + "%",  change: "92% Real-time",       icon: TrendingUpIcon, iconColor: "text-orange-600" },
  ];

  // ── Tab Renderer ─────────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "generator":   return <AILessonPlanGeneratorTab initialMode="lesson" />;
      case "summarizer":  return <LessonSummarizerTab />;
      case "ppt":         return <PPTGeneratorTab />;
      case "assignments": return <AssignmentsTab />;
      case "exams":       return <QuestionPaperTab />;
      case "attendance":  return <AttendanceTab />;
      case "students":    return <StudentsTab />;
      case "messages":    return <MessagesTab />;
      case "analytics":   return <AnalyticsTab />;
      case "library":     return <LessonsPage />;
      case "materials":   return <TeachingMaterialTab />;
      case "quiz":        return <QuizGeneratorTab />;
      case "calendar":    return <CalendarTab />;
      case "data":        return <DataAnalysisTab />;
      case "ai":          return <AIAssistantTab />;
      case "dashboard":
      default:            return <DashboardOverview stats={stats} statsLoading={statsLoading} lessons={lessons} lessonsLoading={lessonsLoading} onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit overflow-x-auto custom-scrollbar">
        {VISIBLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {renderTab()}
    </div>
  );
};

// ── Dashboard Overview (extracted for clarity) ────────────────────────────────
const DashboardOverview = ({ stats, statsLoading, lessons, lessonsLoading, onTabChange }: any) => {
  const quickActions = [
    { icon: BookOpen,      label: "Synthesize Lesson",  tab: "generator",  iconColor: "text-indigo-600" },
    { icon: BrainIcon,     label: "Generate Resources", tab: "materials",  iconColor: "text-amber-600" },
    { icon: Presentation,  label: "Create Slides",      tab: "ppt",        iconColor: "text-violet-600" },
    { icon: ScrollText,    label: "Prepare Exam",       tab: "exams",      iconColor: "text-blue-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-slate-100 animate-pulse" />
          ))
        ) : (
          stats.map((stat: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 transition-all">
                  <stat.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Access */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Operational Hub</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-performance AI synthesis modules</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onTabChange(action.tab)}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-600 hover:bg-white transition-all flex flex-col items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-indigo-600 transition-colors">
                    <action.icon className={cn("w-6 h-6", action.iconColor, "group-hover:text-white")} />
                  </div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Lessons */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Recent Syntheses</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit trail of generated materials</p>
              </div>
              <Button variant="ghost" onClick={() => onTabChange('generator')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                View Registry
              </Button>
            </div>
            <div className="space-y-2">
              {lessonsLoading ? (
                <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
              ) : Array.isArray(lessons) && lessons.length > 0 ? (
                lessons.slice(0, 5).map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{lesson.title}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lesson.subject?.name || 'Academic'} • Grade {lesson.grade || 10}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Syntheses Found</p>
                  <Button onClick={() => onTabChange('generator')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Create First Lesson
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Panel */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Academic Pulse</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time schedule monitoring</p>
            </div>
            <div className="space-y-4">
              {[
                { time: "09:00", label: "Adv. Mathematics", room: "Sec A" },
                { time: "11:30", label: "Organic Chemistry", room: "Sec B" },
                { time: "14:00", label: "World History",     room: "Sec A" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[11px] font-black text-slate-900">{item.time}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">GMT+5</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.room}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => onTabChange('calendar')} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
              Configure Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
