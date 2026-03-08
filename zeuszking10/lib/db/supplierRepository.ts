import { STORAGE_KEYS } from '../../constants/supplier';
import { CustomerTheme, Supplier } from '../../types/supplier';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getStoredSuppliers(): Supplier[] {
  if (!isBrowser()) return [];

  const raw = localStorage.getItem(STORAGE_KEYS.suppliers);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSuppliers(suppliers: Supplier[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
}

export function getStoredCustomer(): CustomerTheme | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(STORAGE_KEYS.customer);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredCustomer() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.customer);
}

export function hasSeenDeleteInfoBanner() {
  if (!isBrowser()) return false;
  return localStorage.getItem(STORAGE_KEYS.supplierDeleteInfoSeen) === 'true';
}

export function setDeleteInfoBannerSeen() {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.supplierDeleteInfoSeen, 'true');
}