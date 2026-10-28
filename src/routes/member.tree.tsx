import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Msg, Page, useMember } from "@/components/member-kit";

export const Route = createFileRoute("/member/tree")({
  head: () => ({ meta: [{ title: "Genealogy Tree — Life OS Member" }, { name: "description", content: "Life OS binary genealogy tree." }, { property: "og:title", content: "Genealogy Tree — Life OS Member" }, { property: "og:description", content: "Life OS binary genealogy tree." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Tree,
});

type Node = { user_id: number; life_id: string; active: boolean; left_carry: number; right_carry: number; left: Node | null; right: Node | null };

function find(n: Node | null, id: string): Node | null {
  if (!n) return null;
  if (n.life_id.toLowerCase() === id.toLowerCase()) return n;
  return find(n.left, id) ?? find(n.right, id);
}

function Person({ n, w, onPick, link }: { n: Node | null; w: number; onPick: (n: Node) => void; link: boolean }) {
  if (!n) return <span className="nt-node empty"><img src="/member-kit/neel/avatar-empty.png" width={w} alt="" /><span>Register</span></span>;
  return (
    <a href="#" className="nt-node" title={`Left carry: ${n.left_carry} | Right carry: ${n.right_carry}`} style={{ opacity: n.active ? 1 : 0.55 }} onClick={(e) => { e.preventDefault(); if (link) onPick(n); }}>
      <img src="/member-kit/neel/avatar-active.png" width={w} alt="" /><span>User ID: {n.life_id}</span>
    </a>
  );
}

function Branch({ n, depth, w, onPick }: { n: Node | null; depth: number; w: number; onPick: (n: Node) => void }) {
  return (
    <div className="nt-col">
      <Person n={n} w={w} onPick={onPick} link={depth > 0} />
      {depth < 2 && n && (
        <>
          <div className="nt-join"><i /></div>
          <div className="nt-kids">
            <Branch n={n.left} depth={depth + 1} w={Math.round(w * 0.8)} onPick={onPick} />
            <Branch n={n.right} depth={depth + 1} w={Math.round(w * 0.8)} onPick={onPick} />
          </div>
        </>
      )}
    </div>
  );
}

function Tree() {
  const q = useMember<Node | null>("tree", "/tree/binary");
  const [root, setRoot] = useState<Node | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const top = root ?? q.data ?? null;

  return (
    <Page title="Placement View">
      <Msg text={q.error ? (q.error as Error).message : null} />
      <form className="nt-search" onSubmit={(e) => {
        e.preventDefault();
        const f = find(q.data ?? null, search.trim());
        setMsg(f ? null : "User not found in your tree");
        if (f) setRoot(f);
      }}>
        <input type="text" aria-label="Search Life ID" value={search} onChange={(e) => setSearch(e.target.value)} />{" "}
        <input type="submit" value="View tree" />
        {root && <input type="submit" value="My tree" style={{ marginLeft: 6 }} onClick={(e) => { e.preventDefault(); setRoot(null); setSearch(""); }} />}
        {msg && <span style={{ color: "#c00", marginLeft: 10 }}>{msg}</span>}
      </form>
      {!top ? <p>{q.isLoading ? "Loading…" : "No tree data yet."}</p> : (
        <div className="nt-wrap">
          <a href="#" className="nt-up" title="Back to my tree" onClick={(e) => { e.preventDefault(); setRoot(null); }}><img src="/member-kit/neel/tree-top.png" width={46} alt="Top" /></a>
          <Branch n={top} depth={0} w={112} onPick={setRoot} />
        </div>
      )}
    </Page>
  );
}
