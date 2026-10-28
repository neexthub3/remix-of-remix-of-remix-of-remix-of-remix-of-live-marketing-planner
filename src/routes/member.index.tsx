import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { referralJoinUrl, type JoinTeam } from "@/lib/join-fields";
import { Page, useMember } from "@/components/member-kit";
import { bdt, LEDGER_LABELS } from "@/lib/member-api";

export const Route = createFileRoute("/member/")({
  head: () => ({ meta: [{ title: "Dashboard — Life OS Member" }, { name: "description", content: "Life OS member dashboard." }, { property: "og:title", content: "Dashboard — Life OS Member" }, { property: "og:description", content: "Life OS member dashboard." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

type Me = { name: string; life_id: string; referral_code: string; phone: string; email: string | null; status: string; created_at: string; referred_by: string | null; total_referral: number };
type Wallet = { withdrawable: number; pending_withdrawal: number; withdrawn: number; cashback_service_only: number; by_type: Record<string, number> };
type Rank = { lifetime_matchings: number; current: { name?: string } | null };

function Dashboard() {
  const me = useMember<Me>("me", "/me").data;
  const w = useMember<Wallet>("wallet", "/wallet").data;
  const rank = useMember<Rank>("rank", "/rank").data;
  if (!me) return null;
  const by = w?.by_type ?? {};
  const totalIn = Object.values(by).reduce((a, b) => a + Number(b), 0);
  const totalOut = Number(w?.withdrawn ?? 0) + Number(w?.pending_withdrawal ?? 0);

  const info: [string, React.ReactNode][] = [
    ["Account Username", me.life_id],
    ["Account Full Name", me.name],
    ["Email Address", me.email ?? "N/A"],
    ["Cell Number", me.phone],
    ["Joining Date Time", me.created_at],
    ["Account Status", me.status],
    ["Referral Code", me.referral_code],
    ["Refer ID", me.referred_by ?? "N/A"],
    ["Total Referral", me.total_referral],
    ["Lifetime Matchings", rank?.lifetime_matchings ?? 0],
  ];
  const line = <tr className="line"><td colSpan={2}><hr /></td></tr>;

  return (
    <Page title="Dashboard">
      <div className="nd-grid">
        <div>
          <div className="nd-title">Credit Statement</div>
          <table className="nd-st"><tbody>
            {["REFERRAL", "MATCHING", "GENERATION", "RANK", "ADJUSTMENT"].map((t) => (
              <tr key={t}><td>Total {LEDGER_LABELS[t]}</td><td className="r">{bdt(by[t])}</td></tr>
            ))}
            {line}
            <tr className="sum"><td>All Total Amount</td><td>{bdt(totalIn)}</td></tr>
            <tr className="sum"><td>Total Withdrawals Amount</td><td>- {bdt(w?.withdrawn)}</td></tr>
            <tr className="sum"><td>Pending Withdrawals</td><td>- {bdt(w?.pending_withdrawal)}</td></tr>
            {line}
            <tr className="cur"><td>Current Credit Balance</td><td>{bdt(w?.withdrawable)}</td></tr>
          </tbody></table>
          <div className="nd-title" style={{ marginTop: 22 }}>Service Wallet Statement</div>
          <table className="nd-st"><tbody>
            <tr><td>Cashback Wallet (service use only)</td><td className="r">{bdt(w?.cashback_service_only)}</td></tr>
            <tr><td>All Total Out Amount</td><td className="r">{bdt(totalOut)}</td></tr>
            {line}
            <tr className="cur"><td>Remaining Current Balance</td><td>{bdt(w?.withdrawable)}</td></tr>
          </tbody></table>
        </div>
        <div className="nd-right">
          <span className="nd-photo"><img src="/member-kit/neel/photo.jpg" alt={me.name} /></span>
          <table className="nd-info"><tbody>
            {info.map(([k, v]) => <tr key={k}><td>{k}</td><td>:</td><td>{v}</td></tr>)}
          </tbody></table>
          <div className="nd-box"><div className="k">ID STATUS</div><div className="v">{rank?.current?.name ?? "Member"}</div></div>
          <div className="nd-box"><div className="k">CURRENT BALANCE</div><div className="v">{bdt(w?.withdrawable)}</div></div>
        </div>
      </div>
      <div className="nd-share">
        <div className="t">Share my direct register affiliate link for my team Affiliations</div>
        <div className="links">
          <JoinLink code={me.referral_code} team="L" />
          <JoinLink code={me.referral_code} team="R" />
        </div>
      </div>
      <div className="nd-msg"><div className="h">Message Box</div><div className="b"><div className="c">Sorry, no message for you right now.</div></div></div>
    </Page>
  );
}

function JoinLink({ code, team }: { code: string; team: JoinTeam }) {
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(referralJoinUrl(window.location.origin, code, team)); }, [code, team]);
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus("Copied"); }
    catch { setStatus("Copy unavailable — select the link above."); }
  }
  return (
    <div>
      <a className="link" href={url || undefined} target="_blank" rel="noreferrer"><small>{team === "L" ? "LEFT TEAM" : "RIGHT TEAM"}</small>{url}</a>
      <button type="button" onClick={copy} disabled={!url}>Copy</button>
      {status && <small role="status" style={{ marginLeft: 6 }}>{status}</small>}
    </div>
  );
}
