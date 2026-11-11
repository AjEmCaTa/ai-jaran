import type { Tone } from "./ui";

export type Contact = {
  id: string;
  email: string;
  company_name: string | null;
  owner_name: string | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  tags: string[];
  legal_basis: "consent" | "customer" | "inquiry" | "cold";
  consent_source: string | null;
  consent_at: string | null;
  status: "active" | "unsubscribed" | "bounced" | "complained";
  import_id: string | null;
  last_contacted_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Stats = { total: number; sendable: number; cold: number; unsubscribed: number; problematic: number };

export const BASIS_TONE: Record<Contact["legal_basis"], Tone> = { consent: "green", customer: "blue", inquiry: "blue", cold: "gray" };
export const STATUS_TONE: Record<Contact["status"], Tone> = { active: "green", unsubscribed: "amber", bounced: "red", complained: "red" };

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const ACTION_LABELS: Record<string, string> = {
  "contact.create": "Dodan kontakt",
  "contact.update": "Izmijenjen kontakt",
  "contact.delete": "Obrisan kontakt",
  "import.done": "CSV uvoz",
  "import.failed": "CSV uvoz prekinut",
  "contact.unsubscribe": "Primalac se odjavio",
  "sequence.approve": "Niz odobren i pokrenut",
  "sequence.pause": "Niz pauziran",
  "step.update": "Izmijenjen mejl u nizu",
  "settings.update": "Promijenjene postavke slanja",
  "test.send": "Test mejl",
  "run.manual": "Ručno pokretanje slanja",
  "run.auto": "Automatsko slanje",
};
