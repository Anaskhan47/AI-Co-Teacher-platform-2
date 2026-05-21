import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Presentation, GraduationCap, Clock, Sparkles, Brain, ArrowRight, Cpu, BookOpen, Trophy, ScrollText, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

// Curriculum standards data structure
const CURRICULUM_DATA: Record<string, Record<string, Record<string, { title: string; code?: string; description: string; objectives: string[] }[]>>> = {
  CBSE: {
    Science: {
      "10": [
        {
          title: "Chemical Reactions and Equations",
          description: "Balanced chemical equations, types of chemical reactions, combination, decomposition, displacement, double displacement, precipitation, neutralization, oxidation and reduction.",
          objectives: ["Balance complex chemical equations", "Identify oxidation and reduction processes", "Predict reaction products"]
        },
        {
          title: "Acids, Bases and Salts",
          description: "Their definitions in terms of furnishing of H+ and OH- ions, General properties, examples and uses, concept of pH scale, importance of pH in everyday life.",
          objectives: ["Understand pH and its logarithmic nature", "Demonstrate acid-base neutralization reactions", "List common industrial salts and preparation methods"]
        },
        {
          title: "Life Processes",
          description: "Basic concept of nutrition, respiration, transport and excretion in plants and animals.",
          objectives: ["Diagram the human digestive and circulatory systems", "Distinguish aerobic vs anaerobic respiration", "Explain kidney filtration mechanisms"]
        },
        {
          title: "Light - Reflection and Refraction",
          description: "Reflection of light by curved surfaces; Images formed by spherical mirrors, centre of curvature, refraction; Laws of refraction, refractive index.",
          objectives: ["Apply lens and mirror formulas accurately", "Construct ray diagrams for spherical lenses", "Explain refractive index dynamics"]
        }
      ],
      "9": [
        {
          title: "Matter in Our Surroundings",
          description: "Physical nature of matter, characteristics of particles of matter, states of matter, change of state, sublimation, evaporation.",
          objectives: ["Understand latent heat of fusion and vaporization", "Differentiate states of matter at particle level", "Analyze cooling effect of evaporation"]
        },
        {
          title: "Cell - The Fundamental Unit of Life",
          description: "Cell as a basic unit of life; prokaryotic and eukaryotic cells, multicellular organisms; cell membrane and cell wall, cell organelles.",
          objectives: ["Compare animal and plant cell structures", "Identify organelles and their primary functions", "Differentiate mitosis and meiosis cell division"]
        }
      ]
    },
    Mathematics: {
      "10": [
        {
          title: "Quadratic Equations",
          description: "Standard form of a quadratic equation ax^2 + bx + c = 0. Solutions of quadratic equations (only real roots) by factorization, and by using quadratic formula.",
          objectives: ["Solve quadratic equations via factorization", "Apply the quadratic formula to find roots", "Determine nature of roots using discriminant"]
        },
        {
          title: "Introduction to Trigonometry",
          description: "Trigonometric ratios of an acute angle of a right-angled triangle. Proof of their existence; values of the trigonometric ratios.",
          objectives: ["Recall and apply trigonometric ratios", "Solve height and distance word problems", "Prove basic trigonometric identities"]
        }
      ]
    }
  },
  ICSE: {
    Physics: {
      "10": [
        {
          title: "Force, Work, Power and Energy",
          description: "Turning effect of force, center of gravity, uniform circular motion, work, power, energy, conservation of energy, machines as force multipliers.",
          objectives: ["Calculate mechanical advantage of levers and pulleys", "Apply the principle of conservation of energy", "Define moments of force and equilibrium conditions"]
        },
        {
          title: "Spectrum of Light and Sound",
          description: "Refraction through glass block and prism, critical angle, total internal reflection, electromagnetic spectrum, sound waves, echo, resonance.",
          objectives: ["Calculate critical angle and refractive index relationship", "Distinguish natural, damped and forced vibrations", "Solve echo distance problems"]
        }
      ]
    }
  },
  NGSS: {
    Science: {
      "10": [
        {
          title: "Matter and Its Interactions",
          code: "HS-PS1",
          description: "Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy levels of atoms.",
          objectives: ["Construct chemical models representing valence configurations", "Predict atomic electronegativity and bonding affinity", "Design alternative chemical process designs satisfying energy criteria"]
        },
        {
          title: "Ecosystems: Interactions, Energy, and Dynamics",
          code: "HS-LS2",
          description: "Mathematical representations to support claims for the cycling of matter and flow of energy among organisms in an ecosystem.",
          objectives: ["Construct trophic pyramid biomass transfer models", "Graph population dynamics affected by carrying capacities", "Evaluate human impact mitigation options for ecosystem stability"]
        }
      ]
    }
  },
  CommonCore: {
    Mathematics: {
      "8": [
        {
          title: "Expressions and Equations Work",
          code: "8.EE",
          description: "Work with radicals and integer exponents. Understand the connections between proportional relationships, lines, and linear equations.",
          objectives: ["Apply properties of integer exponents", "Graph proportional relationships interpreting unit rate as slope", "Solve linear systems of equations algebraically"]
        }
      ]
    }
  }
};

const ForTeachers = () => {
    const navigate = useNavigate();
    const explorerRef = useRef<HTMLDivElement>(null);

    const [selectedBoard, setSelectedBoard] = useState("CBSE");
    const [selectedSubject, setSelectedSubject] = useState("Science");
    const [selectedGrade, setSelectedGrade] = useState("10");

    // Dynamic options
    const availableSubjects = Object.keys(CURRICULUM_DATA[selectedBoard] || {});
    const availableGrades = Object.keys(CURRICULUM_DATA[selectedBoard]?.[selectedSubject] || {});
    const activeTopics = CURRICULUM_DATA[selectedBoard]?.[selectedSubject]?.[selectedGrade] || [];

    const handleBoardChange = (board: string) => {
        setSelectedBoard(board);
        const subjects = Object.keys(CURRICULUM_DATA[board] || {});
        if (subjects.length > 0) {
            setSelectedSubject(subjects[0]);
            const grades = Object.keys(CURRICULUM_DATA[board][subjects[0]] || {});
            if (grades.length > 0) {
                setSelectedGrade(grades[0]);
            }
        }
    };

    const handleSubjectChange = (subject: string) => {
        setSelectedSubject(subject);
        const grades = Object.keys(CURRICULUM_DATA[selectedBoard]?.[subject] || {});
        if (grades.length > 0) {
            setSelectedGrade(grades[0]);
        }
    };

    const handleAction = (tabId: string, topicTitle: string) => {
        const query = new URLSearchParams({
            tab: tabId,
            board: selectedBoard,
            grade: selectedGrade,
            subject: selectedSubject,
            topic: topicTitle
        }).toString();
        navigate(`/app/dashboard?${query}`);
    };

    const scrollToExplorer = () => {
        explorerRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-900 overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-48 pb-20 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-violet-600/15 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-10 relative z-10 text-center">
                    <div className="max-w-5xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 shadow-lg"
                        >
                            <Cpu className="w-4 h-4 text-indigo-400" />
                            Next-Gen Instructional Terminal
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-12 leading-none uppercase"
                        >
                            Calibrate standards <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 italic">Optimize Load.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 mb-16 max-w-4xl mx-auto leading-relaxed font-black uppercase tracking-tighter"
                        >
                            Empower every instructional node to synthesize curriculum-aligned, high-fidelity 
                            lessons and assessments in milliseconds. Total architectural control.
                        </motion.p>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-8"
                        >
                            <Button 
                                onClick={scrollToExplorer}
                                className="h-20 px-12 text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] shadow-2xl shadow-indigo-600/40 transition-all hover:scale-[1.05] active:scale-[0.95] border-none uppercase tracking-[0.3em] group"
                            >
                                Launch Standards Explorer
                                <Sparkles className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => navigate("/app/dashboard")}
                                className="h-20 px-10 text-[10px] font-black border-white/10 bg-white/5 text-white rounded-[1.5rem] hover:bg-white/10 gap-4 transition-all uppercase tracking-[0.3em] backdrop-blur-3xl group"
                            >
                                <PlayCircle className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                                Access Dashboard Direct
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Interactive Standards Explorer Section */}
            <section ref={explorerRef} className="py-24 relative z-20">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="bg-slate-900/40 border border-white/10 rounded-[3rem] p-8 md:p-14 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 pb-8 border-b border-white/5">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                                    Standards <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 italic">Explorer.</span>
                                </h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Query Board Requirements & Synthesize Directly</p>
                            </div>
                            
                            {/* Controls dropdown grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-auto">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Board/Curriculum</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedBoard} 
                                            onChange={(e) => handleBoardChange(e.target.value)}
                                            className="w-full sm:w-48 bg-slate-950/80 text-white rounded-xl border border-white/10 px-5 py-3 h-14 font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none outline-none"
                                        >
                                            {Object.keys(CURRICULUM_DATA).map(b => (
                                                <option key={b} value={b} className="bg-slate-950 text-white">{b === "CommonCore" ? "Common Core" : b}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Subject Area</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedSubject} 
                                            onChange={(e) => handleSubjectChange(e.target.value)}
                                            className="w-full sm:w-48 bg-slate-950/80 text-white rounded-xl border border-white/10 px-5 py-3 h-14 font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none outline-none"
                                        >
                                            {availableSubjects.map(s => (
                                                <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Grade Level</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedGrade} 
                                            onChange={(e) => setSelectedGrade(e.target.value)}
                                            className="w-full sm:w-48 bg-slate-950/80 text-white rounded-xl border border-white/10 px-5 py-3 h-14 font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none outline-none"
                                        >
                                            {availableGrades.map(g => (
                                                <option key={g} value={g} className="bg-slate-950 text-white">Grade {g}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List of Curriculum Modules */}
                        {activeTopics.length > 0 ? (
                            <div className="space-y-12">
                                {activeTopics.map((topic, i) => (
                                    <div key={i} className="bg-slate-950/50 border border-white/5 hover:border-indigo-500/30 transition-all duration-500 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                        
                                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    {topic.code && (
                                                        <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full shadow-inner">
                                                            {topic.code}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        Module 0{i + 1}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">
                                                    {topic.title}
                                                </h3>
                                                
                                                <p className="text-slate-400 font-semibold text-sm leading-relaxed max-w-4xl">
                                                    {topic.description}
                                                </p>

                                                {/* Objectives list */}
                                                <div className="pt-2 space-y-3">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Primary Learning Objectives:</p>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {topic.objectives.map((obj, objIdx) => (
                                                            <div key={objIdx} className="flex items-center gap-3">
                                                                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                                                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{obj}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Grid */}
                                            <div className="w-full lg:w-72 shrink-0 bg-slate-900/50 border border-white/5 rounded-[1.5rem] p-6 space-y-4 shadow-inner">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center mb-2">Neural Synthesis Engine</p>
                                                
                                                <Button 
                                                    onClick={() => handleAction("generator", topic.title)}
                                                    className="w-full h-12 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Brain className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                                    Lesson Plan
                                                </Button>

                                                <Button 
                                                    onClick={() => handleAction("ppt", topic.title)}
                                                    className="w-full h-12 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Presentation className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                    Slide Deck
                                                </Button>

                                                <Button 
                                                    onClick={() => handleAction("quiz", topic.title)}
                                                    className="w-full h-12 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Trophy className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                                    Interactive Quiz
                                                </Button>

                                                <Button 
                                                    onClick={() => handleAction("exams", topic.title)}
                                                    className="w-full h-12 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <ScrollText className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                    Exam Sheet
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-950/40 rounded-[2rem] border border-white/5 border-dashed">
                                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-6 animate-pulse" />
                                <h4 className="text-lg font-black uppercase tracking-widest mb-2">No Curricula Mapped</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Calibration required for selection: {selectedBoard} • {selectedSubject} • Grade {selectedGrade}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Metrics Section */}
            <div className="bg-slate-950 border-y border-white/5 py-40 relative overflow-hidden">
                <div className="container mx-auto px-10 relative z-10">
                    <div className="grid md:grid-cols-3 gap-24">
                        {[
                            { icon: Clock, title: "Save 10+ Hours/Week", desc: "Automate repetitive nodes like grading, planning, and asset synthesis." },
                            { icon: Presentation, title: "AI PPT Maker", desc: "Generate high-fidelity, curriculum-aligned slide decks in milliseconds." },
                            { icon: GraduationCap, title: "Optimized Outcomes", desc: "Focus on delivery while our engine ensures standards integrity." }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-8 group">
                                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-3xl border border-white/10 group-hover:border-indigo-500/50 transition-all duration-500 group-hover:-translate-y-4 shadow-2xl group-hover:rotate-6">
                                    <stat.icon className="w-12 h-12 text-indigo-400" />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{stat.title}</h3>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] leading-relaxed">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature Highlight: PPT Maker */}
            <section className="py-56 relative">
                <div className="container mx-auto px-10">
                    <div className="flex flex-col lg:flex-row items-center gap-40">
                        <div className="lg:w-1/2 space-y-16">
                             <div>
                                <div className="inline-flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-10 bg-indigo-500/10 px-5 py-2.5 rounded-full border border-indigo-500/20 shadow-lg">
                                    <Brain className="w-4 h-4 text-indigo-400" /> AI Spotlight
                                </div>
                                <h2 className="text-6xl md:text-8xl font-black text-white mb-12 tracking-tighter leading-none uppercase">AI <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 italic">Lesson Maker</span></h2>
                                <p className="text-xl md:text-2xl text-slate-500 leading-relaxed mb-16 font-black uppercase tracking-tighter">
                                    Stop wrestling with legacy formatting. Just enter your topic, standard, and grade level. 
                                    Our engine generates professional, high-fidelity slide decks in milliseconds.
                                </p>
                                <div className="space-y-10">
                                    {[
                                        "Alignment with CBSE, ICSE, and Global curriculums",
                                        "Automatic asset retrieval and layout synthesis",
                                        "Export to PowerPoint or PDF instantly",
                                        "Real-time node collaboration with colleagues"
                                    ].map((item, i) => (
                                         <div key={i} className="flex items-center gap-8 group">
                                             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-2xl group-hover:rotate-12 group-hover:scale-110">
                                                 <CheckCircle2 className="w-6 h-6" />
                                             </div>
                                             <span className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">{item}</span>
                                         </div>
                                    ))}
                                </div>
                                 <div className="pt-16">
                                     <Button 
                                         onClick={() => navigate("/app/dashboard?tab=ppt")}
                                         className="h-20 px-12 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-[0_20px_80px_rgba(255,255,255,0.2)] group"
                                     >
                                         Initialize PPT Maker <ArrowRight className="w-5 h-5 ml-4 transition-all group-hover:translate-x-3" />
                                     </Button>
                                 </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="relative">
                                 <div className="absolute inset-0 bg-indigo-600/10 blur-[150px] -z-10 rounded-full scale-125" />
                                 <div className="bg-slate-900 rounded-[4rem] shadow-[0_0_120px_rgba(0,0,0,0.7)] p-10 border border-white/10 rotate-3 hover:rotate-0 transition-all duration-1000 group relative z-10">
                                     <div className="aspect-[4/3] bg-slate-950 rounded-[3rem] overflow-hidden border border-white/10 flex flex-col shadow-inner relative">
                                        {/* Browser-like Toolbar */}
                                         <div className="h-20 bg-slate-900 border-b border-white/5 flex items-center px-10 gap-5">
                                             <div className="flex gap-3">
                                                 <div className="w-4 h-4 rounded-full bg-rose-500/40"></div>
                                                 <div className="w-4 h-4 rounded-full bg-amber-500/40"></div>
                                                 <div className="w-4 h-4 rounded-full bg-emerald-500/40"></div>
                                             </div>
                                             <div className="h-3 w-48 bg-white/5 rounded-full ml-8" />
                                             <div className="ml-auto flex items-center gap-5">
                                                 <div className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-4 shadow-2xl ring-4 ring-indigo-600/10">
                                                     <Sparkles className="w-4 h-4" /> Synthesis Active
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="flex-1 flex overflow-hidden">
                                             {/* Slides Sidebar */}
                                             <div className="w-40 bg-slate-900/50 border-r border-white/5 p-8 flex flex-col gap-8">
                                                 {[1, 2, 3, 4].map((i) => (
                                                     <div key={i} className={`aspect-video rounded-2xl border transition-all duration-700 ${i === 1 ? 'bg-indigo-600/20 border-indigo-500 shadow-2xl scale-105' : 'bg-white/5 border-white/5 opacity-20 hover:opacity-40'}`}>
                                                         <div className="p-4 space-y-3">
                                                             <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                                                             <div className="h-1 w-full bg-white/10 rounded-full"></div>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                             {/* Main Canvas */}
                                             <div className="flex-1 bg-slate-950 p-12 flex items-center justify-center relative">
                                                 <div className="w-full aspect-video bg-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[3rem] p-12 relative overflow-hidden border border-white/10">
                                                     <div className="mb-10">
                                                         <div className="h-10 w-3/5 bg-white/10 rounded-xl mb-5 shadow-inner"></div>
                                                         <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-transparent rounded-full opacity-50"></div>
                                                     </div>
                                                     <div className="flex gap-10">
                                                         <div className="w-1/2 space-y-6 pt-3">
                                                             <div className="h-3 w-full bg-white/5 rounded-full"></div>
                                                             <div className="h-3 w-11/12 bg-white/5 rounded-full"></div>
                                                             <div className="h-3 w-4/5 bg-white/5 rounded-full"></div>
                                                         </div>
                                                         <div className="w-1/2 h-40 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center border border-indigo-500/20 relative group/icon overflow-hidden shadow-inner">
                                                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                                                             <Sparkles className="w-16 h-16 text-indigo-500 opacity-40 group-hover/icon:scale-125 group-hover/icon:rotate-12 transition-all duration-1000" />
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                      {/* Tooltip Overlay */}
                                      <div className="absolute -bottom-10 -right-10 bg-slate-950/95 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 flex items-center gap-6 group-hover:translate-y-[-20px] transition-all duration-1000">
                                          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 ring-4 ring-indigo-600/10">
                                              <Sparkles className="w-8 h-8 text-white" />
                                          </div>
                                          <div>
                                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Generation Status</p>
                                              <p className="font-black text-white text-2xl tracking-tighter uppercase leading-none">Synthesis Ready</p>
                                          </div>
                                      </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-64 bg-slate-950 text-center relative overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 bg-indigo-600/10 blur-[200px] pointer-events-none" />
                <div className="container mx-auto px-10 relative z-10">
                    <h2 className="text-6xl md:text-9xl font-black text-white mb-16 tracking-tighter leading-none uppercase">Ready to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 italic">Synchronize?</span></h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-10">
                        <Button 
                            onClick={scrollToExplorer}
                            className="h-24 px-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-[0.3em] shadow-[0_20px_80px_rgba(79,70,229,0.4)] border-none transition-all hover:scale-[1.05] active:scale-[0.95] group"
                        >
                            Open Explorer
                            <Sparkles className="w-5 h-5 ml-4 group-hover:rotate-12 transition-transform" />
                        </Button>
                    </div>
                    <p className="mt-16 text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Zero Latency Onboarding • Cancel Instantly</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ForTeachers;
