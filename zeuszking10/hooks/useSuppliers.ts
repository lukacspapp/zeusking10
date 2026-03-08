'use client';

import { useEffect, useState } from 'react';
import { getStoredSuppliers, saveSuppliers } from '../lib/db/supplierRepository';
import { Supplier } from '../types/supplier';


export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    setSuppliers(getStoredSuppliers());
  }, []);

  const persistSuppliers = (nextSuppliers: Supplier[]) => {
    setSuppliers(nextSuppliers);
    saveSuppliers(nextSuppliers);
  };

  return {
    suppliers,
    setSuppliers: persistSuppliers,
  };
}