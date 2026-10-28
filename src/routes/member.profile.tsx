import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Msg, Page, useMember } from "@/components/member-kit";
import { memberApi } from "@/lib/member-api";

export const Route = createFileRoute("/member/profile")({
  head: () => ({ meta: [{ title: "My Profile — Life OS Member" }, { name: "description", content: "View and edit your Life OS profile." }, { property: "og:title", content: "My Profile — Life OS Member" }, { property: "og:description", content: "View and edit your Life OS profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

const TOP: [string, string][] = [
  ["name", "Full Name"], ["father_name", "Father's Name"], ["mother_name", "Mother's Name"],
  ["nominee_name", "Nominee's Name"], ["nominee_relation", "Relation With Nominee"], ["dob", "Date of Birth"],
  ["nid_number", "Acc. NID No"], ["blood_group", "Blood Group"],
];
const BOTTOM: [string, string][] = [
  ["post_code", "Post Code"], ["ward_no", "Ward No"], ["union_name", "Union / Municipality"],
  ["upazila", "Sub-District Name"], ["district", "District Name"],
];
const inp: React.CSSProperties = { width: 293, height: 35, border: "1px solid #AAA", background: "#FAFAFA", padding: "0 10px", fontSize: 16, boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 16, height: 42, width: "45%" };

function Profile() {
  const q = useMember<Record<string, string | null>>("profile", "/profile");
  const me = useMember<{ email: string | null; phone: string }>("me", "/me").data;
  const settings = useMember<Record<string, string>>("settings", "/settings");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => {
    if (q.data) setF(Object.fromEntries(Object.entries(q.data).map(([k, v]) => [k, v ?? ""])));
  }, [q.data]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setMsg({ ok: false, t: "Choose a JPG, PNG or WebP photo." });
    if (file.size > 1024 * 1024) return setMsg({ ok: false, t: "Photo must be under 1 MB." });
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fields = { ...f }; delete fields["photo_base64"]; 
      await memberApi("/profile", { body: photo ? { ...fields, photo_base64: photo } : fields });
      setMsg({ ok: true, t: "Profile updated successfully." });
      await q.refetch();
      setPhoto(null);
    } catch (err) {
      setMsg({ ok: false, t: (err as Error).message });
    } finally { setBusy(false); }
  };

  const field = ([k, l]: [string, string]) => (
    <tr key={k}>
      <td>{l}</td><td>:</td>
      <td><input type="text" placeholder={k === "dob" ? "YYYY-MM-DD" : undefined} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></td>
    </tr>
  );
  const img = photo || f["photo_base64"];
  const locked = busy || !q.data || !settings.data || settings.data["profile_edit_status"] === "0";

  return (
    <Page title="My Profile">
      <form onSubmit={save} className="np-form">
        <Msg ok={msg?.ok} text={msg?.t ?? null} />
        <Msg text={q.error ? (q.error as Error).message : settings.error ? (settings.error as Error).message : settings.data?.["profile_edit_status"] === "0" ? "Profile editing is currently disabled." : null} />
        <div className="np-grid">
          <table className="np-t"><tbody>
            {TOP.map(field)}
            <tr><td>Email Address</td><td>:</td><td><input readOnly value={me?.email ?? ""} /></td></tr>
            <tr><td>Mobile Number</td><td>:</td><td><input readOnly value={me?.phone ?? ""} /></td></tr>
            {field(["phone_alt", "Alternate Number"])}
            <tr><td>Address</td><td>:</td><td><textarea value={f["address_current"] ?? ""} onChange={(e) => setF({ ...f, address_current: e.target.value })} /></td></tr>
            {BOTTOM.map(field)}
          </tbody></table>
          <table className="np-t np-r"><tbody>
            <tr><td>Passport Photo</td><td>:</td><td>{img ? <img src={img} alt="Passport" className="np-photo" /> : "No photo available"}</td></tr>
            <tr><td>New Photo</td><td>:</td><td><input type="file" accept="image/*" onChange={onFile} className="np-file" /></td></tr>
            <tr><td style={{ height: 70 }} /><td /><td /></tr>
            <tr><td /><td /><td><input type="submit" value={busy ? "Saving…" : "Save"} disabled={locked} /></td></tr>
          </tbody></table>
        </div>
      </form>
    </Page>
  );
}
