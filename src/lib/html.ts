import { WP_URL } from "./site";

/**
 * Prepares WordPress post/page HTML for rendering inside the Next.js frontend:
 *  - strips inline <script> and Gutenberg block delimiters
 *  - rewrites internal WordPress links to frontend routes
 *  - keeps media URLs pointing at the WordPress host (images must not break)
 *  - hardens <img> tags with lazy loading / async decoding
 *  - makes tables and embeds scrollable on mobile via a wrapper class
 */
export function prepareContent(html: string): string {
  if (!html) return "";

  const wpHost = WP_URL.replace(/^https?:\/\//, "");

  // 1. Pull media URLs out of harm's way while the WordPress origin is
  //    stripped from the rest of the markup.
  const media: string[] = [];
  let out = html.replace(
    /\s(src|srcset)=(["'])(https?:\/\/[^"']+)\2/gi,
    (_match, attribute: string, quote: string, url: string) => {
      media.push(url);
      return ` ${attribute}=${quote}__media_${media.length - 1}__${quote}`;
    },
  );

  // 2. Never execute scripts coming from the CMS.
  out = out
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove Gutenberg block comments; they are noise in rendered HTML.
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "");

  // 3. Rewrite links to the WordPress host so visitors stay on the new frontend.
  out = out.replace(
    new RegExp(`href=(["'])https?://(?:www\\.)?${escapeRegExp(wpHost)}/([^"']*)\\1`, "gi"),
    (_match, quote: string, path: string) => `href=${quote}/${path}${quote}`,
  );

  // 4. Drop any remaining reference to the WordPress origin in text and links.
  out = out.replace(new RegExp(escapeRegExp(WP_URL), "g"), "");

  // 5. Restore media URLs, and point root-relative media at the WordPress host.
  out = out.replace(/__media_(\d+)__/g, (_match, index: string) => media[Number(index)]);
  out = out.replace(
    /(\ssrc=)(["'])\/wp-content\/([^"']*)\2/gi,
    (_match, attribute: string, quote: string, path: string) =>
      `${attribute}${quote}${WP_URL}/wp-content/${path}${quote}`,
  );
  out = out.replace(
    /(\ssrcset=)(["'])\/wp-content\/([^"']*)\2/gi,
    (_match, attribute: string, quote: string, path: string) =>
      `${attribute}${quote}${WP_URL}/wp-content/${path}${quote}`,
  );

  // 6. Legacy imports left media pointing at the old demo domain
  //    (…/wp-content/uploads/sites/3/…). The files live in this site's own
  //    uploads folder, so map them back.
  out = out.replace(
    /https?:\/\/[^/"'\s]+\/[^"'\s]*?\/wp-content\/uploads\/sites\/\d+\//gi,
    `${WP_URL}/wp-content/uploads/`,
  );

  // 7. Rendering niceties.
  out = out
    // Images: add performance attributes (only when the tag lacks them).
    .replace(/<img\b([^>]*)>/gi, (match: string, attributes: string) => {
      const next = attributes.includes("loading=") ? attributes : `${attributes} loading="lazy"`;
      return `<img${next.includes("decoding=") ? next : `${next} decoding="async"`}>`;
    })
    // Wrap wide tables so they scroll instead of breaking the layout.
    .replace(/<table\b/gi, '<div class="table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>");

  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extracts the first image from post content, used as a fallback thumbnail. */
export function firstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/** Reads the <iframe> out of an embed block for video posts. */
export function firstEmbed(html: string): string | null {
  const match = html.match(/<(?:iframe|video)[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}
