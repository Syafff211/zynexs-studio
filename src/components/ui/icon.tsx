import * as React from "react";
import {
  Globe,
  Sparkles,
  Palette,
  Share2,
  Bot,
  Wallet,
  Zap,
  ShieldCheck,
  Headphones,
  MousePointerClick,
  MessageCircle,
  Camera,
  Music2,
  Link as LinkIcon,
  Rocket,
  Crown,
  Star,
  Gift,
  Tag,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  CreditCard,
  Server,
  Cloud,
  Lock,
  Heart,
  PlayCircle,
  Send,
  Mail,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  Globe,
  Sparkles,
  Palette,
  Share2,
  Bot,
  Wallet,
  Zap,
  ShieldCheck,
  Headphones,
  MousePointerClick,
  MessageCircle,
  Camera,
  Music2,
  Instagram: Camera,
  Youtube: PlayCircle,
  Link: LinkIcon,
  Rocket,
  Crown,
  Star,
  Gift,
  Tag,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  CreditCard,
  Server,
  Cloud,
  Lock,
  Heart,
  PlayCircle,
  Send,
  Mail,
};

export const ICON_NAMES = Object.keys(REGISTRY);

/** Renders a Lucide icon by name, with a sensible fallback. */
export function Icon({
  name,
  className,
  fallback = "Sparkles",
}: {
  name?: string | null;
  className?: string;
  fallback?: string;
}) {
  const Component = (name && REGISTRY[name]) || REGISTRY[fallback] || Sparkles;
  return <Component className={className} aria-hidden="true" />;
}
