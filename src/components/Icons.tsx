// Thin adapter over @phosphor-icons/react, keeping the existing call sites
// (<XIcon size={..} className={..} style={..} />) unchanged across ~30 files.
// Hand-rolled SVG icons were replaced here rather than at every import site.
import {
  MagnifyingGlass,
  MapPin,
  Bed,
  ShieldCheck,
  Star,
  Calendar,
  ChatCircle,
  Heart,
  User,
  Globe,
  Sparkle,
  ArrowLeft,
  House,
  List,
  X,
  WifiHigh,
  SlidersHorizontal,
  Camera,
  UsersThree,
  Lock,
  WarningCircle,
  EnvelopeSimple,
  CheckCircle,
  Siren,
  MapTrifold,
  Clock,
} from "@phosphor-icons/react/dist/ssr";

export interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  fill?: string;
  /** Switches to Phosphor's filled weight -- the selected-state cue for tab/nav icons. */
  active?: boolean;
}

const STROKE_WEIGHT = "regular";

export function SearchIcon({ className, size = 20, style, active }: IconProps) {
  return <MagnifyingGlass size={size} weight={active ? "fill" : STROKE_WEIGHT} className={className} style={style} />;
}

export function MapPinIcon({ className, size = 18, style }: IconProps) {
  return <MapPin size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function BedIcon({ className, size = 18, style }: IconProps) {
  return <Bed size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function ShieldCheckIcon({ className, size = 16, style }: IconProps) {
  return <ShieldCheck size={size} weight="fill" className={className} style={style} />;
}

/** `fill` toggles Phosphor's filled weight and sets its color -- used for the star rating display. */
export function StarIcon({ className, size = 16, fill = "none", style }: IconProps) {
  const isFilled = fill !== "none";
  return <Star size={size} weight={isFilled ? "fill" : "regular"} color={isFilled ? fill : undefined} className={className} style={style} />;
}

export function CalendarIcon({ className, size = 18, style }: IconProps) {
  return <Calendar size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function MessageIcon({ className, size = 18, style, active }: IconProps) {
  return <ChatCircle size={size} weight={active ? "fill" : STROKE_WEIGHT} className={className} style={style} />;
}

export function HeartIcon({ className, size = 18, style }: IconProps) {
  return <Heart size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function UserIcon({ className, size = 18, style, active }: IconProps) {
  return <User size={size} weight={active ? "fill" : STROKE_WEIGHT} className={className} style={style} />;
}

export function UsersIcon({ className, size = 18, style, active }: IconProps) {
  return <UsersThree size={size} weight={active ? "fill" : STROKE_WEIGHT} className={className} style={style} />;
}

export function GlobeIcon({ className, size = 18, style }: IconProps) {
  return <Globe size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function SparklesIcon({ className, size = 18, style }: IconProps) {
  return <Sparkle size={size} weight="fill" className={className} style={style} />;
}

export function ArrowLeftIcon({ className, size = 20, style }: IconProps) {
  return <ArrowLeft size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function HouseIcon({ className, size = 22, style, fill, active }: IconProps) {
  return <House size={size} weight={active || (fill && fill !== "none") ? "fill" : STROKE_WEIGHT} className={className} style={style} />;
}

export function ListIcon({ className, size = 22, style }: IconProps) {
  return <List size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function CloseIcon({ className, size = 22, style }: IconProps) {
  return <X size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function WifiIcon({ className, size = 16, style }: IconProps) {
  return <WifiHigh size={size} weight="bold" className={className} style={style} />;
}

export function SlidersIcon({ className, size = 16, style }: IconProps) {
  return <SlidersHorizontal size={size} weight="bold" className={className} style={style} />;
}

export function CameraIcon({ className, size = 18, style }: IconProps) {
  return <Camera size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function LockIcon({ className, size = 18, style }: IconProps) {
  return <Lock size={size} weight="fill" className={className} style={style} />;
}

export function WarningIcon({ className, size = 18, style }: IconProps) {
  return <WarningCircle size={size} weight="fill" className={className} style={style} />;
}

export function MailIcon({ className, size = 18, style }: IconProps) {
  return <EnvelopeSimple size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function CheckIcon({ className, size = 18, style }: IconProps) {
  return <CheckCircle size={size} weight="fill" className={className} style={style} />;
}

export function AlertIcon({ className, size = 18, style }: IconProps) {
  return <Siren size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function MapIcon({ className, size = 18, style }: IconProps) {
  return <MapTrifold size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}

export function ClockIcon({ className, size = 18, style }: IconProps) {
  return <Clock size={size} weight={STROKE_WEIGHT} className={className} style={style} />;
}
