'use client';

import { DragEvent, ChangeEvent } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';

type BulkImportCardProps = {
  uploadLoading: boolean;
  dragActive: boolean;
  setDragActive: (value: boolean) => void;
  onUpload: (file: File) => void;
  onInvalidFile: () => void;
};

function isValidFileType(fileName: string) {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
}

export function BulkImportCard({
  uploadLoading,
  dragActive,
  setDragActive,
  onUpload,
  onInvalidFile,
}: BulkImportCardProps) {
  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    }

    if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!isValidFileType(file.name)) {
      onInvalidFile();
      return;
    }

    onUpload(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidFileType(file.name)) {
      onInvalidFile();
      return;
    }

    onUpload(file);
  };

  return (
    <SectionCard
      title="Bulk Import"
      icon={<FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />}
    >
      <div className="p-6 pt-0">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive
              ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
        >
          {uploadLoading ? (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processing file...
              </p>
            </div>
          ) : (
            <>
              <FileSpreadsheet className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drag & drop CSV or Excel here
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                File must contain an &quot;AWRS&quot; or &quot;URN&quot; column
              </p>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="inline-block bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all cursor-pointer shadow-button hover:shadow-button-hover"
              >
                Choose File
              </label>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}