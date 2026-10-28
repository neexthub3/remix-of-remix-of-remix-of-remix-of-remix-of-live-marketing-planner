import { createFileRoute } from "@tanstack/react-router";
import { DataTable, Page, useMember } from "@/components/member-kit";

export const Route = createFileRoute("/member/sponsors")({
  head: () => ({ meta: [{ title: "Referral List — Life OS Member" }, { name: "description", content: "Your direct Life OS referrals." }, { property: "og:title", content: "Referral List — Life OS Member" }, { property: "og:description", content: "Your direct Life OS referrals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Sponsors,
});

type Direct = { id: number; life_id: string; name?: string; phone: string; created_at: string; is_active: number | boolean };

function Sponsors() {
  const me = useMember<{ life_id: string }>("me", "/me").data;
  const q = useMember<{ directs: Direct[] }>("enroll", "/tree/enrollment");
  const rows = q.data?.directs ?? [];
  return (
    <Page title="Referral Step Report">
      <p className="nr-level">Direct Downline by the account {me?.life_id} &ensp; (my group {rows.length})</p>
      <DataTable
        head={["Joining Time", "User ID", "Full Name", "Cell Number", "Designation", "Status"]}
        rows={rows.map((r) => [r.created_at.slice(0, 10), <span key="u" style={{ color: "#0577B5" }}>{r.life_id}</span>, r.name ?? "—", r.phone, "Member", r.is_active ? "Active" : "Inactive"])}
      />
    </Page>
  );
}
