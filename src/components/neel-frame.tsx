import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ShoppingCart } from "lucide-react";

export const NEEL_LINKS = [
  { rel: "stylesheet", href: "/member-kit/neel.css" },
];

/** Public (signed-out) pages in the member-panel look: same header, blue bar, footer and whole-canvas scaling. */
export function NeelFrame({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new ResizeObserver(([e]) => {
      if (!e) return;
      const vw = e.contentRect.width;
      setScale(vw < 800 ? vw / 766 : (vw * 0.78125) / 750);
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} className="neel-viewport">
      <div className="lifeos-member neel" style={{ zoom: scale }}>
        <header className="neel-header">
          <Link to="/" aria-label="Life OS home" className="neel-header-inner">
            <img className="neel-mark" src="/member-kit/neel/logo-mark.png" alt="" />
            <span className="neel-sep" />
            <img className="neel-word" src="/member-kit/neel/logo-word.png" alt="Life OS" />
            <span className="neel-sep" />
            <span className="neel-cart" aria-hidden="true"><ShoppingCart size={86} strokeWidth={1.1} /></span>
          </Link>
        </header>
        <nav className="neel-nav neel-nav-public">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Member Login</Link></li>
            {nav}
          </ul>
        </nav>
        <main className="neel-main"><div id="main_member">{children}</div></main>
        <footer className="neel-footer">CopyRights©{new Date().getFullYear()} By Life OS Limited</footer>
      </div>
    </div>
  );
}
