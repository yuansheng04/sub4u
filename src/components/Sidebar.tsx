"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavLink {
  href: string;
  labelKey: string;
}

interface NavGroup {
  labelKey: string;
  icon: string;
  href?: string;
  children?: NavLink[];
}

const NAV: NavGroup[] = [
  {
    labelKey: "nav.subscriptions",
    icon: "💳",
    href: "/",
  },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of NAV) {
      if (group.children?.some((c) => pathname.startsWith(c.href))) {
        init[group.labelKey] = true;
      }
    }
    return init;
  });

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col min-h-screen">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-accent">sub4u</h1>
      </div>
      <nav className="flex-1 p-2">
        {NAV.map((group) => {
          if (group.href) {
            const active = group.href === "/" ? pathname === "/" : pathname.startsWith(group.href);
            return (
              <Link
                key={group.labelKey}
                href={group.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-black/5"
                }`}
              >
                <span>{group.icon}</span>
                <span>{t(group.labelKey)}</span>
              </Link>
            );
          }

          const isExpanded = expanded[group.labelKey] ?? false;
          const hasActive = group.children?.some((c) => pathname.startsWith(c.href));

          return (
            <div key={group.labelKey} className="mb-1">
              <button
                onClick={() => toggle(group.labelKey)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  hasActive
                    ? "text-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-black/5"
                }`}
              >
                <span>{group.icon}</span>
                <span className="flex-1 text-left">{t(group.labelKey)}</span>
                <span className={`text-[10px] text-foreground/30 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                  ▶
                </span>
              </button>
              {isExpanded && group.children && (
                <div className="ml-5 border-l border-border/60 pl-3 mt-0.5">
                  {group.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-accent/10 text-accent"
                            : "text-foreground/50 hover:text-foreground hover:bg-black/5"
                        }`}
                      >
                        {t(child.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
