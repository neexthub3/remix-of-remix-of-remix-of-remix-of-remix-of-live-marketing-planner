import { createFileRoute } from "@tanstack/react-router";
import { DataTable, Page, useMember } from "@/components/member-kit";

export const Route = createFileRoute("/member/own-accounts")({
  head: () => ({ meta: [{ title: "Own Account List — Life OS Member" }, { name: "description", content: "Every account placed under your Life OS position." }, { property: "og:title", content: "Own Account List — Life OS Member" }, { property: "og:description", content: "Every account placed under your Life OS position." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Own,
});

type M = { id: number; life_id: string; created_at: string; is_active: number | boolean; placement_side?: "L" | "R" | null; sponsor_life_id?: string | null; placement_life_id?: string | null };

function Own() {
  const q = useMember<{ members: M[] }>("downline", "/tree/downline");
  const rows = q.data?.members ?? [];
  return (
    <Page title="My Own Account List">
      <DataTable
        head={["Sl", "Joining Time", "User ID", "Sponsor ID", "Placement ID", "Place At", "Status"]}
        rows={rows.map((m, i) => [i + 1, m.created_at.slice(0, 10), <span key="u" style={{ color: "#0577B5" }}>{m.life_id}</span>, m.sponsor_life_id ?? "—", m.placement_life_id ?? "—", m.placement_side === "L" ? "Left Team" : m.placement_side === "R" ? "Right Team" : "—", m.is_active ? "Active" : "Inactive"])}
      />
    </Page>
  );
}
