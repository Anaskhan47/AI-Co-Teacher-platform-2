import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ── TAB ERROR BOUNDARY ────────────────────────────────────────────────────────
// Isolates exceptions inside individual tabs to prevent the entire dashboard from crashing.
export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL TAB EXCEPTION]", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50 border-2 border-rose-200/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto my-12 animate-in fade-in duration-500">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Workspace Suspended</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {this.props.fallbackTitle || "An isolation boundary caught a runtime fault."}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500 max-w-md">
            This module has been isolated to protect the dashboard interface. You can safely switch tabs or recover this frame.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            variant="outline"
            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Recover Module
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── ROOT APP ERROR BOUNDARY ──────────────────────────────────────────────────
// Catches global rendering exceptions and prevents raw blank screens.
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[GLOBAL PLATFORM EXCEPTION]", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 selection:bg-indigo-100">
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 max-w-xl text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                Platform Recovery
              </h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">
                Absolute Zero Safe State Enabled
              </p>
            </div>
            <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
              A high-level runtime exception was intercepted at the root domain. 
              The application engine has suspended execution to protect user state.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Reboot Application
              </Button>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                variant="outline"
                className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
              >
                <Home className="w-4 h-4 mr-2" /> Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
