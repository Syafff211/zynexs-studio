"use client";

import Image from "next/image";
import {
  Copy,
  ExternalLink,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn, formatIDR } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";

interface ProductShareDialogProps {
  product: ProductWithCategory;
  open: boolean;
  onClose: () => void;
}

/**
 * Build the URL at interaction time so previews, custom domains, and local
 * development all share the origin that the visitor is actually using.
 */
function getProductUrl(slug: string): string {
  return new URL(`/store/${encodeURIComponent(slug)}`, window.location.origin).toString();
}

function getShareText(product: ProductWithCategory): string {
  const price = product.is_custom_price ? "Harga dikelola admin" : formatIDR(product.price);
  const duration = product.duration ? ` / ${product.duration}` : "";
  return `Lihat ${product.name} di Zynex Studio — ${price}${duration}.`;
}

/** Clipboard API needs HTTPS. The textarea fallback also keeps copy working on
 * older browsers and development hosts without a secure context. */
async function copyText(value: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the synchronous compatibility path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Browser tidak mengizinkan penyalinan.");
}

export function ProductShareDialog({ product, open, onClose }: ProductShareDialogProps) {
  const { success, error } = useToast();

  const handleCopy = async () => {
    try {
      await copyText(getProductUrl(product.slug));
      success("Tautan produk disalin", "Siap ditempel dan dibagikan ke siapa saja.");
      onClose();
    } catch {
      error("Gagal menyalin tautan", "Izinkan akses clipboard atau salin dari address bar.");
    }
  };

  const handleSystemShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: `${product.name} — Zynex Studio`,
        text: getShareText(product),
        url: getProductUrl(product.slug),
      });
      onClose();
    } catch (shareError) {
      // Cancelling the native share sheet is an intentional user action.
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      error("Produk belum dibagikan", "Coba WhatsApp atau salin tautannya secara manual.");
    }
  };

  const openChannel = (channel: "whatsapp" | "telegram") => {
    const productUrl = getProductUrl(product.slug);
    const shareText = getShareText(product);
    const destination =
      channel === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${productUrl}`)}`
        : `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;

    // This runs directly inside a click handler, so mobile browsers can hand
    // the URL to the installed app. An anchor keeps `noopener` protection
    // without the false "popup blocked" signal some browsers return for
    // window.open(..., "noopener").
    const anchor = document.createElement("a");
    anchor.href = destination;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    onClose();
  };

  const actions = [
    {
      label: "Bagikan lainnya",
      description: "Pilih aplikasi di perangkatmu",
      icon: Share2,
      tone: "border-brand-400/20 bg-brand-500/[0.08] text-brand-200",
      onClick: handleSystemShare,
    },
    {
      label: "WhatsApp",
      description: "Kirim ke kontak atau grup",
      icon: MessageCircle,
      tone: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
      onClick: () => openChannel("whatsapp"),
    },
    {
      label: "Telegram",
      description: "Bagikan melalui Telegram",
      icon: Send,
      tone: "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",
      onClick: () => openChannel("telegram"),
    },
    {
      label: "Salin tautan",
      description: "Tempel di chat atau media sosial",
      icon: Copy,
      tone: "border-violet-400/20 bg-violet-400/[0.07] text-violet-300",
      onClick: handleCopy,
    },
  ] as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bagikan produk"
      description="Kirim produk ini ke teman atau simpan tautannya untuk nanti."
      size="md"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500/18 to-accent-500/12 ring-1 ring-white/10">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <Icon name={product.icon} className="h-6 w-6 text-brand-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {product.category && (
            <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.13em] text-brand-300/75">
              {product.category.name}
            </p>
          )}
          <p className="mt-0.5 truncate text-[14.5px] font-semibold text-white">{product.name}</p>
          <p className="mt-1 text-[12.5px] text-white/45">
            {product.is_custom_price ? "Dikelola admin" : formatIDR(product.price)}
            {product.duration ? ` · ${product.duration}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-left transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 active:scale-[0.99]"
              aria-label={`${action.label}: ${action.description}`}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
                  action.tone
                )}
              >
                <ActionIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-white">{action.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-white/40">
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-white/35">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Tautan mengarah langsung ke halaman detail produk, lengkap dengan harga dan informasinya.
      </p>
    </Modal>
  );
}
