/**
 * Icons by name, for diagrams ([Bot]) and inline chips (<Chip icon="Bot">).
 * Lucide icons, plus a few of our own drawn in the same 24px, 2px-stroke style.
 * Add a name here to use it anywhere.
 */

import type { SVGProps } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Ban,
  Bed,
  Bird,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Brain,
  BrainCircuit,
  Camera,
  Check,
  CircleDollarSign,
  Clock,
  Coffee,
  Cpu,
  Crosshair,
  DoorOpen,
  Eye,
  FileText,
  Flag,
  Footprints,
  Gauge,
  Gift,
  Hammer,
  Heart,
  Hourglass,
  Image,
  Laptop,
  Layers,
  Lightbulb,
  ListChecks,
  Medal,
  MessageSquare,
  Mic,
  Moon,
  Package,
  Palette,
  PartyPopper,
  Pause,
  PenTool,
  Phone,
  PhoneIncoming,
  Pizza,
  Play,
  Puzzle,
  Rabbit,
  Repeat,
  Rocket,
  RotateCcw,
  Ruler,
  Scale,
  ScanEye,
  ScanSearch,
  Scissors,
  Search,
  Shapes,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Snail,
  Sparkles,
  Star,
  Telescope,
  Timer,
  Trophy,
  Tv,
  User,
  Users,
  Wand,
  Wrench,
  X,
  Zap,
  Database,
  Server,
  Radio,
  Link,
  Monitor,
  Pencil,
  ClipboardList,
  Merge,
  Split,
  Anchor,
  Undo2,
  Share2,
  Globe,
  Grid3x3,
  Magnet,
  Shuffle,
  Filter,
  Feather,
  type LucideIcon,
} from "lucide-react";

type Svg = (p: SVGProps<SVGSVGElement>) => React.ReactElement;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** a 2x2 brick, seen from the side: two studs on a block */
const Brick: Svg = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="10" width="18" height="10" rx="1.5" />
    <rect x="5.5" y="6" width="5" height="4" rx="1" />
    <rect x="13.5" y="6" width="5" height="4" rx="1" />
  </svg>
);

/** what the first agents kept building */
const Blob: Svg = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 18.5c-2.6-.6-3.9-3.4-2.8-6 .8-1.9 2.1-2.4 2.6-4.6.6-2.6 3.3-4.4 6.2-3.6 2.4.7 3 2.6 4.8 3.4 2.4 1 3.6 3.3 2.8 5.7-.8 2.6-3.4 3.4-5.8 4.5-2.7 1.2-5 1.2-7.8.6Z" />
    <circle cx="9.5" cy="11" r=".6" fill="currentColor" />
    <circle cx="14" cy="11.5" r=".6" fill="currentColor" />
  </svg>
);

/** the GitHub mark (Lucide dropped brand icons) */
const GitHub: Svg = (p) => (
  <svg {...base} {...p}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const OWN: Record<string, Svg> = { brick: Brick, blob: Blob, GitHub };

const LUCIDE: Record<string, LucideIcon> = {
  Database,
  Server,
  Radio,
  Link,
  Monitor,
  Pencil,
  ClipboardList,
  Merge,
  Split,
  Anchor,
  Undo2,
  Share2,
  Globe,
  Grid3x3,
  Magnet,
  Shuffle,
  Filter,
  Feather,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Ban,
  Bed,
  Bird,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Brain,
  BrainCircuit,
  Camera,
  Check,
  CircleDollarSign,
  Clock,
  Coffee,
  Cpu,
  Crosshair,
  DoorOpen,
  Eye,
  FileText,
  Flag,
  Footprints,
  Gauge,
  Gift,
  Hammer,
  Heart,
  Hourglass,
  Image,
  Laptop,
  Layers,
  Lightbulb,
  ListChecks,
  Medal,
  MessageSquare,
  Mic,
  Moon,
  Package,
  Palette,
  PartyPopper,
  Pause,
  PenTool,
  Phone,
  PhoneIncoming,
  Pizza,
  Play,
  Puzzle,
  Rabbit,
  Repeat,
  Rocket,
  RotateCcw,
  Ruler,
  Scale,
  ScanEye,
  ScanSearch,
  Scissors,
  Search,
  Shapes,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Snail,
  Sparkles,
  Star,
  Telescope,
  Timer,
  Trophy,
  Tv,
  User,
  Users,
  Wand,
  Wrench,
  X,
  Zap,
};

export function hasIcon(name: string) {
  return name in OWN || name in LUCIDE;
}

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Own = OWN[name];
  if (Own) return <Own width={size} height={size} className={className} aria-hidden />;
  const L = LUCIDE[name];
  if (L) return <L size={size} strokeWidth={2} className={className} aria-hidden />;
  // unknown names show a small dot instead of breaking the figure
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
