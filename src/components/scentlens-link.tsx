import { ExternalLinkIcon } from "./icons";

export function ScentLensLink() {
  return (
    <a
      href="https://github.com/bhnsadhu/scent-lens"
      className="scentlens-link"
      target="_blank"
      rel="noreferrer"
    >
      ScentLens
      <ExternalLinkIcon width={12} height={12} />
    </a>
  );
}

/** Keep the recognizer's name linked in scanner status and error messages too. */
export function ScentLensText({ children }: { children: string }) {
  return children.split(/\b(ScentLens)\b/).map((part, index) =>
    part === "ScentLens" ? <ScentLensLink key={index} /> : part,
  );
}
