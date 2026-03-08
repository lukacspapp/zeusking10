export const STORAGE_KEYS = {
  customer: 'awrs_customer',
  suppliers: 'awrs_suppliers',
  supplierDeleteInfoSeen: 'supplier_delete_info_seen',
} as const;

export const MAX_HISTORY_DOWNLOAD_SELECTION = 10;

export const CHECK_FREQUENCIES = ['on-demand', 'daily', 'weekly', 'monthly'] as const;