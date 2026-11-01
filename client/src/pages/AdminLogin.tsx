import { useState } from "react";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/auth";

export default function AdminLogin() {
  const login = useAuth((s) => s.login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-[#111] px-4">
      <motion.form
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!login(password)) setError(true);
        }}
        className="w-full max-w-[18rem] rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="grid size-9 place-items-center rounded-full bg-wine-soft text-wine">
          <Lock className="size-4" />
        </span>
        <h1 className="mt-3 text-[17px] font-semibold">Painel Look Show</h1>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Área restrita. Digite a senha de administradora.</p>
        <Input
          type="password"
          autoFocus
          placeholder="Senha"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className={`mt-4 h-9 text-xs ${error ? "border-red-500 ring-2 ring-red-500/15" : ""}`}
        />
        {error && <p className="mt-1.5 text-[10px] text-red-600">Senha incorreta.</p>}
        <Button type="submit" className="mt-3 h-9 w-full text-xs">
          Entrar
        </Button>
        <Link to="/" className="mt-3 block text-center text-[9px] text-muted-foreground hover:text-foreground">
          ← Voltar para a loja
        </Link>
      </motion.form>
    </div>
  );
}
