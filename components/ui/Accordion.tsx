'use client';

import { useState } from 'react';

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-outline-variant/30 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 py-5 sm:py-6 text-left group"
      >
        <span className="font-headline-sm text-[15px] sm:text-headline-sm text-primary group-hover:text-secondary transition-colors">
          {question}
        </span>
        <span
          className={`material-symbols-outlined text-secondary text-[22px] shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pb-5 sm:pb-6 pr-8">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface AccordionData {
  question: string;
  answer: string;
}

export default function Accordion({ items }: { items: AccordionData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-5 sm:px-8">
      {items.map((item, index) => (
        <AccordionItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}
