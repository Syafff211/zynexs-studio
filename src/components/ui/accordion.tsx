"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({
  items,
  className,
  defaultOpenId,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null);

  if (!items.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "glass overflow-hidden rounded-2xl transition-colors duration-300",
              isOpen && "border-brand-400/30 bg-white/[0.07]"
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                id={`faq-trigger-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
              >
                <span className="text-[15px] font-semibold text-white">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-5 shrink-0 text-brand-300 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${item.id}`}
              role="region"
              aria-labelledby={`faq-trigger-${item.id}`}
              hidden={!isOpen}
              className="grid"
            >
              <div className="px-5 pb-5 text-[14px] leading-relaxed text-white/60 sm:px-6">
                {item.answer.split("\n").map((line, index) => (
                  <p key={index} className={index > 0 ? "mt-2" : undefined}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
