"use client";

import { createContext, useContext } from "react";

export type DashboardBusiness = {
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  owner_email: string;
  work_start: string;
  work_end: string;
  work_days: string[];
};

export type BusinessContextValue = {
  business: DashboardBusiness;
  ownerName: string;
  setOwnerName: (name: string) => void;
  refresh: () => Promise<void>;
};

export const BusinessContext = createContext<BusinessContextValue | null>(null);

export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("useBusiness mora biti unutar dashboard layouta.");
  return value;
}

export function normalizeBusiness(b: Record<string, unknown> | null | undefined): DashboardBusiness {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: str(b?.id),
    slug: str(b?.slug),
    name: str(b?.name),
    category: str(b?.category),
    city: str(b?.city),
    address: str(b?.address),
    phone: str(b?.phone),
    owner_email: str(b?.owner_email),
    work_start: str(b?.work_start),
    work_end: str(b?.work_end),
    work_days: Array.isArray(b?.work_days) ? (b!.work_days as unknown[]).filter((d): d is string => typeof d === "string") : [],
  };
}
