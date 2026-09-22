import { Fragment, type ReactNode } from 'react';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';
import { parseLegalContent, type LegalBlock } from '@/lib/legal';
import type { Database } from '@/lib/supabase/database.types';

type LegalPage = Database['public']['Tables']['legal_pages']['Row'];

/** Renders **bold** spans; everything else is plain text (no HTML injection). */
function renderInline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

function renderBlocks(blocks: LegalBlock[]): ReactNode {
  return blocks.map((block, i) => {
    if (block.type === 'paragraph') return <p key={i}>{renderInline(block.text)}</p>;
    if (block.type === 'list') {
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    return null;
  });
}

export default function LegalContent({ page }: { page: LegalPage }) {
  const blocks = parseLegalContent(page.content);
  const intro = blocks.filter((b) => b.type !== 'section');
  const sections = blocks.filter((b): b is Extract<LegalBlock, { type: 'section' }> => b.type === 'section');

  return (
    <LegalLayout eyebrow="Legal" title={page.title} description={page.summary || ''} pageName={page.title}>
      {intro.length > 0 && (
        <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-primary [&_strong]:font-semibold">
          {renderBlocks(intro)}
        </div>
      )}
      {sections.map((section, i) => (
        <LegalSection key={i} title={section.title}>
          {renderBlocks(section.blocks)}
        </LegalSection>
      ))}
      <p className="text-xs text-outline text-center">
        Last updated {new Date(page.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </LegalLayout>
  );
}
