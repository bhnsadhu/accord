import type { MetadataRoute } from "next";

// AI training and bulk-scrape crawlers. They follow every filter link on /discover,
// and each distinct query string is a fresh uncached server render.
const BLOCKED_BOTS = [
  "GPTBot",
  "meta-externalagent",
  "meta-webindexer",
  "FacebookBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Google-Extended",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "omgili",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      // Everyone else (search engines): crawl pages, but not infinite filter/sort/page combos.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/discover?*", "/compare?*"] },
    ],
  };
}
