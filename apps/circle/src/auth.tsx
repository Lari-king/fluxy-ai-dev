import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, ChevronRight, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "./supabase";

export function AuthScreen({ initialMode, onBack }: { initialMode: "login" | "signup"; onBack: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (authError) throw authError;
        if (!data.session) setSent(true);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de continuer pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page">
    <button className="auth-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Accueil</button>
    <section className="auth-art"><img src="/art/circle-landing-family-v1.png" alt="Une famille entourée de ses proches" /><div><span>Circle</span><h1>La famille, sans tout porter seul.</h1><p>Chaque personne voit uniquement ce qui l’aide à agir.</p></div></section>
    <section className="auth-panel">
      {sent ? <div className="auth-confirm"><span><Check size={26} /></span><h2>Regardez votre boîte mail.</h2><p>Le lien reçu vous ramènera directement dans Circle.</p><button className="secondary-button" type="button" onClick={() => setSent(false)}>Utiliser une autre adresse</button></div> : <>
        <div className="auth-brand"><img src="/art/circle-logo-mark-v1.png" alt="" /><b>Circle</b></div>
        <span className="eyebrow">{mode === "signup" ? "Votre premier cercle" : "Heureux de vous revoir"}</span>
        <h2>{mode === "signup" ? "Créer mon compte" : "Se connecter"}</h2>
        <p>{mode === "signup" ? "Deux minutes suffisent. Le reste se construit au fil du quotidien." : "Retrouvez vos foyers et ce qui compte aujourd’hui."}</p>
        <form onSubmit={submit}>
          {mode === "signup" && <label><span>Votre prénom</span><div><UserRound size={18} /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></div></label>}
          <label><span>Adresse e-mail</span><div><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div></label>
          <label><span>Mot de passe</span><div><LockKeyhole size={18} /><input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required /></div></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="landing-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : null}{mode === "signup" ? "Créer mon compte" : "Entrer dans Circle"}<ChevronRight size={18} /></button>
        </form>
        <button className="auth-switch" type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "J’ai déjà un compte" : "Créer mon compte"}</button>
        <small><ShieldCheck size={15} /> Vos proches n’accèdent jamais à tout votre foyer.</small>
      </>}
    </section>
  </main>;
}
