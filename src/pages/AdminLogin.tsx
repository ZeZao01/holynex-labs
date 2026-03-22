import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Lock, Mail, LogIn, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Credenciais inválidas. Tente novamente.");
        return;
      }

      if (!data?.session) {
        setError("Não foi possível iniciar a sessão. Verifique o acesso e tente novamente.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError("Falha ao entrar. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
            >
              <Lock className="h-7 w-7 text-primary" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="text-sm text-muted-foreground">Painel gerencial Holynex</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@holynex.com"
                  className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
