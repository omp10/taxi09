import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Briefcase,
  CalendarDays,
  Car,
  CircleSlash,
  Clock3,
  Headphones,
  Headset,
  Map,
  MapPin,
  Mars,
  Moon,
  Mountain,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Ticket,
  UserCheck,
  UserRoundCheck,
  Venus,
} from 'lucide-react';

/**
 * Content blocks are admin-edited data, so an item carries an icon *name*
 * rather than a component. Only the names actually used by seeded blocks are
 * registered here - pulling in all of lucide would bloat the bundle for no
 * gain.
 *
 * Anything unrecognised resolves to a neutral glyph: a typo in the admin panel
 * should degrade to a generic icon, never blank out a tile or throw while
 * rendering.
 */
const ICONS = {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Briefcase,
  CalendarDays,
  Car,
  CircleSlash,
  Clock3,
  Headphones,
  Headset,
  Map,
  MapPin,
  Mars,
  Moon,
  Mountain,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Ticket,
  UserCheck,
  UserRoundCheck,
  Venus,
};

export const iconByName = (name, fallback = ShieldCheck) =>
  ICONS[String(name || '').trim()] || fallback;

export default iconByName;
