import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memberApi, memberToken } from "@/lib/member-api";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { NeelFrame, NEEL_LINKS } from "@/components/neel-frame";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Member Login — Life OS" },
      { name: "description", content: "Sign in to your Life OS member account." },
      { property: "og:title", content: "Member Login — Life OS" },
      { property: "og:description", content: "Sign in to your Life OS member account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: NEEL_LINKS,
  }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErr(null); setBusy(true);
    try {
      memberToken.clear();
      const r = await memberApi<{ token: string }>("/login", { body: { username: fd.get("username"), password: fd.get("password") } });
      memberToken.set(r.token);
      navigate({ to: "/member" });
    } catch (x) {
      setErr((x as Error).message === "Failed to fetch" ? "Member server is not reachable right now." : (x as Error).message);
    } finally { setBusy(false); }
  };
  const root = () => {
    const u = document.querySelector<HTMLInputElement>('input[name="username"]');
    const pw = document.querySelector<HTMLInputElement>('input[name="password"]');
    if (u) u.value = "ROOT";
    pw?.focus();
  };
  return (
    <NeelFrame>
      <div className="main_bg about nl">
        <h2 id="heading">Member Login</h2>
        <div className="nl-box">
          <div className="nl-h">Login to Your Account</div>
          <form className="nl-form" onSubmit={submit}>
            <table><tbody>
              <tr><td><label htmlFor="lu">Username / Life ID</label></td><td>:</td><td><input id="lu" type="text" name="username" required autoComplete="username" /></td></tr>
              <tr><td><label htmlFor="lp">Password</label></td><td>:</td><td><input id="lp" type={show ? "text" : "password"} name="password" required autoComplete="current-password" /> <button type="button" className="nl-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={10} /> : <Eye size={10} />}</button></td></tr>
              <tr><td /><td /><td><label><input type="checkbox" name="remember" /> Remember my username</label></td></tr>
              <tr><td /><td /><td><button type="submit" disabled={busy}>{busy ? "Signing in…" : "Login"}</button> <a href="/contact">Forgot password?</a></td></tr>
              <tr><td /><td /><td><button type="button" className="nl-link" onClick={root}>Login as ROOT (company account)</button></td></tr>
            </tbody></table>
            {err && <p role="alert" className="nj-err">{err}</p>}
          </form>
        </div>
      </div>
    </NeelFrame>
  );
}
