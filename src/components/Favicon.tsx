import { resolveDomain } from "@/lib/service-domains";

function getFaviconUrl(url: string | null, name?: string): string | null {
  // 1. Try explicit URL
  if (url) {
    try {
      const domain = new URL(
        url.startsWith("http") ? url : `https://${url}`
      ).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch { /* fall through */ }
  }
  // 2. Try resolving domain from name
  if (name) {
    const domain = resolveDomain(name);
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }
  }
  return null;
}

function getInitial(name: string): string {
  const ch = name.charAt(0);
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  return ch;
}

export function Favicon({
  url,
  name,
  size = 20,
}: {
  url: string | null;
  name?: string;
  size?: number;
}) {
  const src = getFaviconUrl(url, name);
  if (!src) {
    const letter = name ? getInitial(name) : "?";
    return (
      <span
        className="rounded bg-accent/15 text-accent font-bold flex items-center justify-center shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        const span = document.createElement("span");
        span.className =
          "rounded bg-accent/15 text-accent font-bold flex items-center justify-center shrink-0";
        span.style.width = `${size}px`;
        span.style.height = `${size}px`;
        span.style.fontSize = `${size * 0.55}px`;
        span.textContent = name ? getInitial(name) : "?";
        el.replaceWith(span);
      }}
    />
  );
}
