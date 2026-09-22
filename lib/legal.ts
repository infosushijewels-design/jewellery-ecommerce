/**
 * Legal / information pages.
 * Built-in pages ship with default content in their own routes; an admin-created
 * legal_pages row with the same slug overrides that content. Any other slug is
 * served from /legal/[slug].
 */
export const BUILT_IN_LEGAL_PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', path: '/privacy-policy' },
  { slug: 'terms', title: 'Terms & Conditions', path: '/terms' },
  { slug: 'shipping-policy', title: 'Shipping Policy', path: '/shipping-policy' },
  { slug: 'return-policy', title: 'Returns & Exchanges', path: '/return-policy' },
] as const;

export function isBuiltInLegalSlug(slug: string) {
  return BUILT_IN_LEGAL_PAGES.some((p) => p.slug === slug);
}

export function legalPagePath(slug: string) {
  return BUILT_IN_LEGAL_PAGES.find((p) => p.slug === slug)?.path ?? `/legal/${slug}`;
}

export type LegalBlock =
  | { type: 'section'; title: string; blocks: LegalBlock[] }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

/**
 * Parses the lightweight format used by the admin editor:
 *   ## Heading        → starts a new section
 *   - item / * item   → bullet list
 *   blank line        → paragraph break
 *   **bold**          → bold (rendered by the page component)
 */
export function parseLegalContent(content: string): LegalBlock[] {
  const root: LegalBlock[] = [];
  let current: LegalBlock[] = root;
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) current.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) current.push({ type: 'list', items: list });
    list = [];
  };

  for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      const section: LegalBlock = { type: 'section', title: heading[1].trim(), blocks: [] };
      root.push(section);
      current = section.blocks;
    } else if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
    } else if (!line) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return root;
}
