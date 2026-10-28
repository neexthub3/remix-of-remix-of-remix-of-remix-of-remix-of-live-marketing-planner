import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DataTable, Page, useMember } from "@/components/member-kit";

export const Route = createFileRoute("/member/referral-level")({
  head: () => ({ meta: [{ title: "Referral Level — Life OS Member" }, { name: "description", content: "Your Life OS referrals by network level." }, { property: "og:title", content: "Referral Level — Life OS Member" }, { property: "og:description", content: "Your Life OS referrals by network level." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Levels,
});

type M = { id: number; life_id: string; name?: string | null; created_at: string; is_active: number | boolean; sponsor_life_id?: string | null };
const OPTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function Levels() {
  const [form, setForm] = useState({ start: 1, end: 3 });
  const [range, setRange] = useState(form);
  const q = useMember<{ levels: { level: number; members: M[] }[] }>(`levels-${range.start}-${range.end}`, `/tree/levels?start=${range.start}&end=${range.end}`);
  const levels = q.data?.levels ?? [];
  return (
    <Page title="Referral Level">
      <form className="nr-filter" onSubmit={(e) => { e.preventDefault(); setRange({ start: form.start, end: Math.max(form.start, form.end) }); }}>
        <b>Network Level Start:</b>{" "}
        <select value={form.start} onChange={(e) => setForm({ ...form, start: +e.target.value })} style={{ width: 50 }}>{OPTS.map((o) => <option key={o}>{o}</option>)}</select>{" "}&emsp;
        <b>Network Level End:</b>{" "}
        <select value={form.end} onChange={(e) => setForm({ ...form, end: +e.target.value })} style={{ width: 50 }}>{OPTS.map((o) => <option key={o}>{o}</option>)}</select>{" "}&emsp;
        <input type="submit" value="Go" />
      </form>
      {q.isLoading && <p>Loading…</p>}
      {levels.map((l) => (
        <div key={l.level} style={{ marginTop: 10 }}>
          <p className="nr-level">Network Level: {l.level} ( {l.members.length} )</p>
          <DataTable
            head={["SN", "Joining Time", "Username", "Full Name", "Referral ID", "Designation", "Status"]}
            rows={l.members.map((m, i) => [i + 1, m.created_at.slice(0, 10), <span key="u" style={{ color: "#0577B5" }}>{m.life_id}</span>, m.name ?? "—", m.sponsor_life_id ?? "—", "Member", m.is_active ? "Active" : "Inactive"])}
          />
        </div>
      ))}
    </Page>
  );
}
