import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Loader2, Sparkles, FileText, Download, Printer, Settings2, ScrollText, ChevronLeft, History } from "lucide-react";
import { toast } from "sonner";
import { downloadAsPDF } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** 
 * ── RESILIENCE UTILITIES ──
 * Prevents .map() crashes on malformed AI data.
 */
function safeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export function QuestionPaperTab() {
  const [searchParams] = useSearchParams();
  const paramGrade = searchParams.get("grade");
  const paramSubject = searchParams.get("subject");
  const paramTopic = searchParams.get("topic");

  const [formData, setFormData] = useState({
    subject: paramSubject || "",
    grade: paramGrade || "10",
    marks: "80",
    difficulty: "Moderate",
    examType: "Final Examination",
    syllabus: paramTopic || "",
    breakdown: {
      mcqs: 10,
      short: 5,
      long: 3
    }
  });
  const [paper, setPaper] = useState<any>(null);
  const [activeView, setActiveView] = useState<"paper" | "scheme">("paper");
  const [pdfText, setPdfText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subjects } = useQuery({
    queryKey: ["curriculum", "CBSE", formData.grade],
    queryFn: async () => {
      const res = await api.get("/curriculum/metadata", {
        params: { curriculum: "CBSE", class: formData.grade },
      });
      return res.data?.data || res.data;
    },
    enabled: !!formData.grade,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/exams/generate", { ...data, pdfText });
      return res;
    },
    onSuccess: (res) => {
      if (res.success) {
        setPaper(res.data);
        toast.success("Examination paper synthesized successfully!");
      } else {
        toast.error(res.error || "Failed to generate paper");
      }
    },
  });

  const handleGenerate = (textOverride?: string) => {
    if (!formData.subject) {
      toast.error("Please select a target subject area.");
      return;
    }
    generateMutation.mutate({
      ...formData,
      pdfText: textOverride !== undefined ? textOverride : pdfText,
    });
  };

  const handleDownload = () => {
    if (!paper) return;
    const exportData = {
      ...paper,
      subject: formData.subject,
      grade: `Class ${formData.grade}`,
      curriculum: "CBSE", 
      duration: "180m"
    };
    downloadAsPDF(exportData, `${paper.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    toast.success("Examination paper exported!");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
        <div className="text-left space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Examination Builder
          </h1>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
            Institutional Assessment Synthesis Protocol
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Synthesis Protocol</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => handleGenerate()}
            disabled={!formData.subject || generateMutation.isPending}
            className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] px-10 rounded-[1.2rem] shadow-xl shadow-indigo-600/20 border-none transition-all group flex items-center gap-3"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )}
            {generateMutation.isPending ? "Synthesizing..." : "Start Synthesis"}
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        <Card className="bg-white border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden">
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Grade Level</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(v) => setFormData({ ...formData, grade: v, subject: "" })}
                >
                  <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((g) => (
                      <SelectItem key={g} value={g} className="text-xs font-bold text-slate-700">Class {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Subject Area</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(v) => setFormData({ ...formData, subject: v })}
                >
                  <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {subjects?.subjects?.map((s: string) => (
                      <SelectItem key={s} value={s} className="text-xs font-bold text-slate-700">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Exam Category</Label>
                <Select
                  value={formData.examType}
                  onValueChange={(v) => setFormData({ ...formData, examType: v })}
                >
                  <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm">
                    <SelectValue placeholder="Exam Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {["Unit Test", "Monthly Assessment", "Mid-Term", "Final Examination", "Mock Exam"].map((t) => (
                      <SelectItem key={t} value={t} className="text-xs font-bold text-slate-700">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Complexity Protocol</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                >
                  <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {["Easy", "Moderate", "Hard"].map((level) => (
                      <SelectItem key={level} value={level} className="text-xs font-bold text-slate-700">{level} Intensity</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_2.5fr] gap-8 items-end">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Syllabus Scope</Label>
                <Input
                  placeholder="e.g. Chapters 1-4, Algebra Fundamentals"
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-xs font-black px-4 shadow-sm focus:ring-4 ring-indigo-500/5 transition-all"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Target Marks</Label>
                <Input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-sm font-black text-slate-900 text-center shadow-sm"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Section Breakdown (MCQ / Short / Long)</Label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                  <Select onValueChange={(v) => {
                    const total = parseInt(v);
                    setFormData({
                      ...formData,
                      breakdown: {
                        mcqs: Math.floor(total * 0.5),
                        short: Math.floor(total * 0.3),
                        long: Math.ceil(total * 0.2)
                      }
                    });
                  }}>
                    <SelectTrigger className="h-14 bg-indigo-50 border-indigo-100 rounded-[1.2rem] text-indigo-600 font-black text-xs px-4 shadow-sm">
                      <SelectValue placeholder="Rapid Count" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                      {["5", "10", "15", "20", "25", "30", "50"].map((n) => (
                        <SelectItem key={n} value={n} className="font-bold text-xs">{n} Total Questions</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      value={formData.breakdown.mcqs}
                      onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, mcqs: parseInt(e.target.value) || 0 } })}
                      className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-sm font-black text-center shadow-sm"
                    />
                    <Input
                      type="number"
                      value={formData.breakdown.short}
                      onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, short: parseInt(e.target.value) || 0 } })}
                      className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-sm font-black text-center shadow-sm"
                    />
                    <Input
                      type="number"
                      value={formData.breakdown.long}
                      onChange={(e) => setFormData({ ...formData, breakdown: { ...formData.breakdown, long: parseInt(e.target.value) || 0 } })}
                      className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-sm font-black text-center shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Context Injection</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Synchronize generation with reference PDF</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    const formDataFile = new FormData();
                    formDataFile.append("file", file);
                    api.post("/upload/pdf", formDataFile).then((res) => {
                      if (res.success) {
                        setPdfText(res.data.text);
                        toast.success("Academic context synthesized.");
                      }
                    }).finally(() => setIsUploading(false));
                  }}
                />
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    "h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all gap-2",
                    pdfText ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {pdfText ? "Context Latched" : "Attach PDF Reference"}
                </Button>
              </div>

              <Button
                onClick={() => handleGenerate()}
                disabled={generateMutation.isPending}
                className="h-16 px-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all gap-4 flex items-center justify-center group"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                    <span>Initialize Synthesis</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative pt-16 border-t border-slate-200/60">
        {paper && (
          <div className="flex items-center justify-between mb-12 max-w-[1000px] mx-auto">
            <div className="flex p-2 bg-white border border-slate-200 rounded-[2rem] shadow-xl">
              <button
                onClick={() => setActiveView("paper")}
                className={cn(
                  "px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  activeView === "paper"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-500 hover:text-indigo-600",
                )}
              >
                Question Paper
              </button>
              <button
                onClick={() => setActiveView("scheme")}
                className={cn(
                  "px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                  activeView === "scheme"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-500 hover:text-indigo-600",
                )}
              >
                Marking Scheme
              </button>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                className="h-14 w-14 bg-white border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                <Printer className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                className="h-14 w-14 bg-white border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                <Download className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {paper ? (
            <motion.div
              key="paper-view"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="max-w-[950px] mx-auto bg-white border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-sm p-20 min-h-[1200px] relative font-serif ring-1 ring-slate-900/5"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />

              {activeView === "paper" ? (
                <div className="space-y-16 text-slate-900">
                  <div className="text-center space-y-4 pb-12 border-b border-slate-900/10">
                    <h1 className="text-3xl font-black uppercase tracking-[0.3em] text-slate-900 font-sans">
                      Institutional Examination
                    </h1>
                    <h2 className="text-lg font-bold text-slate-500 uppercase font-sans tracking-[0.2em]">
                      {paper.title}
                    </h2>
                    <div className="flex justify-between items-end pt-12 font-sans text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <div className="text-left space-y-2">
                        <p>Subject: <span className="text-slate-900">{formData.subject}</span></p>
                        <p>Grade: <span className="text-slate-900">Class {formData.grade}</span></p>
                      </div>
                      <div className="text-right space-y-2">
                        <p>Duration: <span className="text-slate-900">180 Minutes</span></p>
                        <p>Max. Marks: <span className="text-slate-900">{paper.totalMarks}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3 font-sans">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Settings2 className="w-3 h-3" />
                      General Instructions:
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      {paper.instructions}
                    </p>
                  </div>

                  <div className="space-y-20">
                    {safeArray(paper.sections).map((section: any, idx: number) => (
                      <div key={idx} className="space-y-10">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.5em] text-center py-5 border-y border-slate-900/10 bg-slate-50/50 font-sans">
                          {section.name}
                        </h3>
                        <div className="space-y-12">
                          {safeArray(section.questions).map((q: any, qIdx: number) => (
                            <div
                              key={qIdx}
                              className="flex items-start justify-between gap-10 group"
                            >
                              <div className="flex gap-8 flex-1">
                                <span className="font-bold text-slate-900 text-lg min-w-[2.5rem] font-sans pt-1">
                                  {qIdx + 1}.
                                </span>
                                <div className="space-y-6">
                                  <p className="text-lg text-slate-900 leading-relaxed font-serif">
                                    {q.q}
                                  </p>
                                  {q.options && (
                                    <div className="grid grid-cols-2 gap-x-16 gap-y-6 pt-4">
                                      {safeArray(q.options).map(
                                        (opt: string, optIdx: number) => (
                                          <div
                                            key={optIdx}
                                            className="text-[15px] text-slate-700 flex items-start gap-5 font-sans"
                                          >
                                            <span className="font-black text-slate-300">
                                              ({String.fromCharCode(97 + optIdx)})
                                            </span>
                                            <span className="font-medium">
                                              {opt}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-sans border-b-2 border-slate-900/10 pb-1 self-start">
                                [{q.marks}]
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-24 text-center">
                    <div className="w-16 h-1 bg-slate-100 mx-auto mb-8" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">
                      --- End of Examination Document ---
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-16 text-slate-900 font-sans">
                  <div className="text-center pb-12 border-b border-slate-900/10">
                    <h1 className="text-3xl font-black uppercase tracking-[0.3em]">
                      Evaluation Guide
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px] mt-4">
                      Institutional Marking Protocol • {paper.title}
                    </p>
                  </div>

                  <div className="space-y-12">
                    <div className="space-y-8">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 border-l-4 border-indigo-600 pl-6">
                        Model Solutions Matrix
                      </h3>
                      <div className="grid gap-6">
                        {Object.entries(paper.answerKey || {}).map(
                          ([qId, ans]: any) => (
                            <div
                              key={qId}
                              className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] flex gap-8 items-start transition-all hover:bg-white hover:shadow-xl hover:border-indigo-100"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center font-black shrink-0 text-base shadow-sm">
                                {qId}
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Expected Institutional Response
                                </p>
                                <p className="text-base font-bold text-slate-800 leading-relaxed">
                                  {ans}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="space-y-8 pt-16 border-t border-slate-100">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 border-l-4 border-indigo-600 pl-6">
                        Pedagogical Marking Rubrics
                      </h3>
                      <div className="p-10 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl">
                        <p className="text-base font-medium text-slate-300 whitespace-pre-wrap leading-loose italic font-serif">
                          {paper.markingScheme}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in zoom-in duration-1000">
              <div className="relative mb-12 group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse" />
                <div className="relative w-32 h-32 rounded-[3.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                  <Sparkles className="w-14 h-14 text-white transition-colors duration-500" />
                </div>
              </div>
              <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase leading-none">
                Awaiting Synthesis Protocol
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 max-w-sm leading-loose opacity-60">
                Execute the configuration matrix above to initialize institutional grade assessment generation
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
