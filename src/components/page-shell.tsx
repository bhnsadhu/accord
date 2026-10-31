import type { ReactNode } from "react";

type PageWidth = "full" | "workspace" | "reference" | "reading" | "account" | "form";

/** Every route shares the navigation's outer frame; only the reading measure varies. */
export function PageShell({ children, className = "", width = "full", as: Tag = "div" }: {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
  as?: "div" | "article";
}) {
  return (
    <Tag className={`page-shell ${className}`}>
      {width === "full" ? children : <div className={`page-content page-content--${width}`}>{children}</div>}
    </Tag>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="page-title">{children}</h1>;
}
