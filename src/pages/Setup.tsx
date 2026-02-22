import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SetupState = "checking" | "first-run" | "login-required" | "authorized";

const SetupPage = () => {
  const [setupState, setSetupState] = useState<SetupState>("checking");
  const [checkError, setCheckError] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("admin@admin.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Setup form
  const [accessToken, setAccessToken] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@admin.com");
  const [adminPassword, setAdminPassword] = useState("admin");
  const [showSetupPw, setShowSetupPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setSetupState("checking");
    setCheckError("");

    try {
      // First check if current user is already logged in as admin
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: isAdminData } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        if (isAdminData) {
          setSetupState("authorized");
          return;
        }
      }

      // Check if any admin exists at all (first-run detection)
      // This uses a SECURITY DEFINER function that's safe for anon access
      const { data: adminExists, error: rpcError } = await supabase.rpc("admin_exists");

      if (rpcError) {
        // If admin_exists function doesn't exist yet, it's definitely a first run
        // This happens before any setup has been run
        setSetupState("first-run");
        return;
      }

      if (!adminExists) {
        // No admins exist yet → first-time setup, allow open access
        setSetupState("first-run");
      } else {
        // Admins exist → require login
        setSetupState("login-required");
      }
    } catch (err: any) {
      // On any error (e.g. DB not set up yet), allow first-run
      setSetupState("first-run");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        if (!data) {
          await supabase.auth.signOut();
          setLoginError("This account does not have admin access.");
        } else {
          setSetupState("authorized");
        }
      }
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    }
    setLoginLoading(false);
  };

  const runSetup = async () => {
    setLoading(true);
    setResult(null);
    try {
      let data: any;
      const body = {
        accessToken,
        projectRef,
        email: adminEmail,
        password: adminPassword,
      };

      if (accessToken && projectRef) {
        try {
          const res = await fetch("/api/setup-database", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          data = await res.json();
          if (!res.ok && data?.error) throw new Error(data.error);
        } catch (vercelErr: any) {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke("setup-database", { body });
          if (edgeError) throw new Error(edgeError.message);
          data = edgeData;
        }
      } else {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke("setup-database", { body });
        if (edgeError) throw new Error(edgeError.message);
        data = edgeData;
      }

      if (data?.error) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({ success: true, message: data?.message || "Setup complete!" });
        // After successful setup, re-check access (now admins exist, login is needed)
        setTimeout(() => checkAccess(), 1500);
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Unknown error" });
    }
    setLoading(false);
  };

  // ── Loading ──
  if (setupState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  // ── Login Required ──
  if (setupState === "login-required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Setup Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin login required to access setup</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@admin.com"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Input
                  type={showLoginPw ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginError && <p className="text-xs text-destructive mt-1">{loginError}</p>}
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={loginLoading}>
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login to Setup"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-4">
            <a href="/admin" className="hover:underline text-primary">← Back to Admin Panel</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Setup Form (first-run or authorized) ──
  const isFirstRun = setupState === "first-run";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              {isFirstRun
                ? <Unlock className="h-4 w-4 text-primary-foreground" />
                : <Lock className="h-4 w-4 text-primary-foreground" />
              }
            </div>
            <h1 className="text-2xl font-bold text-foreground">🚀 NexaMart Setup</h1>
          </div>
          {!isFirstRun && (
            <button
              onClick={() => supabase.auth.signOut().then(() => checkAccess())}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Logout
            </button>
          )}
        </div>

        {isFirstRun && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 mb-4 mt-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">🔓 First-time Setup Mode</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              No admin account detected. This page is open for initial setup. It will lock after your first admin is created.
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          One-click database setup. Creates all tables, categories, RLS policies, seed data, and your admin user.
          <br />
          <span className="text-xs">Leave Supabase fields empty if using Lovable Cloud.</span>
        </p>

        <div className="space-y-4">
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">For Vercel + Own Supabase</p>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Supabase Access Token</label>
              <Input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="sbp_xxxxxxxxxxxxx (optional)"
              />
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Get your token here <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Project Reference ID</label>
              <Input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="abcdefghijklmnop (optional)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Found in Supabase → Settings → General → Reference ID
              </p>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Admin Email
              {isFirstRun && <span className="ml-2 text-xs text-primary font-medium">← your login email</span>}
            </label>
            <Input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@admin.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Admin Password
              {isFirstRun && <span className="ml-2 text-xs text-amber-600 font-medium">← change this after setup!</span>}
            </label>
            <div className="relative">
              <Input
                type={showSetupPw ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowSetupPw(!showSetupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSetupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isFirstRun && (
              <p className="text-xs text-muted-foreground mt-1">
                Default is <code className="bg-secondary px-1 rounded">admin</code> — please change it after first login via Admin → Settings.
              </p>
            )}
          </div>

          <Button onClick={runSetup} disabled={loading} className="w-full rounded-xl" size="lg">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Setting up...</> : "🚀 Run Setup"}
          </Button>

          {result && (
            <div className={`flex items-start gap-2 p-4 rounded-lg text-sm ${result.success ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
              {result.success
                ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              }
              <div>
                <span className="font-medium">{result.success ? "Success!" : "Error"}</span>
                <p className="text-xs mt-0.5">{result.message}</p>
              </div>
            </div>
          )}

          {result?.success && (
            <div className="bg-green-500/10 border border-green-300/50 dark:border-green-700/30 p-4 rounded-xl text-center space-y-2">
              <p className="font-bold text-green-700 dark:text-green-400">✅ Setup Complete!</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Login with <strong>{adminEmail}</strong> / <strong>{adminPassword}</strong>
              </p>
              <a href="/admin" className="inline-block mt-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                Go to Admin Panel →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
