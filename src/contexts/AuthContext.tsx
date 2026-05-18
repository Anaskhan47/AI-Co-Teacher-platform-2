import { createContext, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export interface AuthContextType {
    user: any | null;
    loading: boolean;
    manualLogin: (user: any, token: string) => void;
    logout: () => void;
}

// ─── SYNCHRONOUS INIT ─────────────────────────────────────────────────────────
// Only restore a REAL previously-authenticated user from localStorage.
// We do NOT auto-provision a guest here — that's done at the route level
// so the public landing page at / remains accessible.
function getInitialUser(): any | null {
    try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user_data');
        if (token && userData && token !== 'guest-bypass-token') {
            return JSON.parse(userData);
        }
    } catch {
        // ignore parse errors
    }
    return null;
}
// ──────────────────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    manualLogin: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(getInitialUser);
    const [loading] = useState(false);

    const setStoreAuth = useAuthStore(state => state.setAuth);
    const clearStoreAuth = useAuthStore(state => state.logout);

    const manualLogin = useCallback((userData: any, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
        setStoreAuth(userData, token);
    }, [setStoreAuth]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setUser(null);
        clearStoreAuth();
    }, [clearStoreAuth]);

    const value = useMemo(() => ({
        user,
        loading,
        manualLogin,
        logout
    }), [user, loading, manualLogin, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
