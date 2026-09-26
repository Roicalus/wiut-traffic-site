import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useJson } from "../lib/data";
import type { Content } from "../lib/content";
import ErrorBoundary from "./ErrorBoundary";
import { Icon, LogoMark } from "./ui";

const NAV = [
  { to: "/results", label: "Results" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/eda", label: "EDA" },
  { to: "/approach", label: "Approach" },
  { to: "/report", label: "Report" },
  { to: "/team", label: "Team" },
  { to: "/links", label: "Links" },
];

type Theme = "light" | "dark";

function useTheme(): [Theme, () => void] {
  const system = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || system());
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
    setTheme(next);
  };
  return [theme, toggle];
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();
  const content = useJson<Content>("content.json");

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-[14.5px] transition-colors ${isActive ? "bg-panel-2 text-ink" : "text-ink-2 hover:text-ink"}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2 focus:shadow-float">
        Skip to content
      </a>
      <header
        className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-[16px] font-semibold text-ink">
            <LogoMark className="h-8" />
            <span>{content.data?.team_name ?? "SoWeNeedAName"}</span>
          </Link>
          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-0.5">
              {NAV.map((n) => (
                <li key={n.to}><NavLink to={n.to} className={link}>{n.label}</NavLink></li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="grid size-9 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
            </button>
            <Link to="/demo" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Live demo
            </Link>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg text-ink hover:bg-panel-2 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              <Icon name={open ? "x" : "menu"} className="size-5" />
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" className="h-[calc(100dvh-60px)] overflow-y-auto border-t border-line bg-bg px-4 pt-3 pb-8 lg:hidden" aria-label="Main">
            <ul className="space-y-1">
              {[{ to: "/demo", label: "Live demo" }, ...NAV].map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium ${isActive ? "bg-panel-2 text-ink" : "text-ink-2"}`}
                  >
                    {n.label}
                    <Icon name="arrow" className="size-4 text-ink-3" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <ErrorBoundary resetKey={pathname}>
        {pathname === "/" ? <Outlet /> : (
          <div className="hero-glow">
          <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
            <Outlet />
          </div>
          </div>
        )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2 text-ink-2">
            <LogoMark className="h-6" /> {content.data?.team_name ?? "SoWeNeedAName"} · WIUT Hackathon 2026
          </span>
          <span className="flex flex-wrap gap-x-5 gap-y-1">
            {(content.data?.links ?? []).slice(0, 2).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="hover:text-ink">{l.label.replace(/ \(.*\)$/, "")}</a>
            ))}
            <span>Code under AGPL-3.0</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
