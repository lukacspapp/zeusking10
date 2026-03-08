import { VerifyResponse } from "../../../types/supplier";


export async function verifySupplier(urn: string): Promise<VerifyResponse> {
  const response = await fetch(`/api/verify?urn=${encodeURIComponent(urn)}`);
  const data: VerifyResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Verify failed (HTTP ${response.status})`);
  }
  console.log(data);

  return data;
}

export async function importSuppliersFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/import-suppliers', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}