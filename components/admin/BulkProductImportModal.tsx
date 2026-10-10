"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/lib/context/ToastContext';
import { BulkProductRow } from '@/app/api/admin/bulk-import-products/route';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Pulls a number out of text like "₹14,999", "14999", or junk like "Custom for admin side" /
 *  "To be confirmed" / blank — any of which fall back to 0 rather than blocking the row. */
function extractNumeric(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function cell(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return value === null || value === undefined ? '' : String(value).trim();
}

/**
 * Adaptively maps one raw spreadsheet row — in whatever column layout the client's own export
 * uses (`Product Name`/`Subcategory`/`Main Category`/`Image 1-3`/`Gold Purity / Karat` etc.) —
 * into the canonical BulkProductRow shape the API expects. Returns null for genuinely empty
 * rows (no image AND no title/subcategory to identify the product by).
 */
function normalizeImportRow(row: Record<string, unknown>): BulkProductRow | null {
  const rawTitle = cell(row, 'Product Name') || cell(row, 'Title') || cell(row, 'title');
  const subcategory = cell(row, 'Subcategory');
  const mainCategory = cell(row, 'Main Category') || cell(row, 'Category') || 'Jewellery';
  const sku = cell(row, 'SKU');
  const productNo = cell(row, 'Product No.');

  const mainImage = cell(row, 'Image 1') || cell(row, 'Main_Image_Drive_Url') || cell(row, 'Image');
  const galleryParts = [cell(row, 'Image 2'), cell(row, 'Image 3')].filter(Boolean);
  const galleryFromColumn = cell(row, 'Gallery_Images')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const resolvedGallery = [...galleryParts, ...galleryFromColumn].join(', ');

  // Garbage row: nothing to show (no photo) and nothing to call it by (no title/subcategory)
  if (!mainImage && !resolvedGallery && !subcategory && !rawTitle) return null;

  const resolvedTitle = rawTitle
    ? rawTitle
    : subcategory
    ? `${subcategory}${sku ? ` (SKU: ${sku})` : ''}`
    : `${mainCategory} Design ${sku || productNo}`.trim();

  const purity = cell(row, 'Gold Purity / Karat');
  const colour = cell(row, 'Gold Colour');
  const type = cell(row, 'Jewellery Type');
  const resolvedMaterial = [purity, colour, type].filter(Boolean).join(' ') || cell(row, 'Material') || '18K Gold';

  const resolvedPrice = extractNumeric(row['Price (?)'] ?? row['Price']);
  const resolvedStock = extractNumeric(row['Stock']);

  return {
    Title: resolvedTitle,
    Category: mainCategory,
    Price: resolvedPrice,
    MRP: cell(row, 'MRP') || undefined,
    Material: resolvedMaterial,
    Stock: resolvedStock,
    Main_Image_Drive_Url: mainImage,
    Gallery_Images: resolvedGallery,
    Description: cell(row, 'Description'),
    Available_Sizes: cell(row, 'Available_Sizes'),
    Certification: cell(row, 'Certification'),
    Badge: cell(row, 'Badge'),
    SKU: sku || undefined,
    Is_Featured: cell(row, 'Is_Featured'),
    Is_New_Arrival: cell(row, 'Is_New_Arrival'),
  };
}

export default function BulkProductImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkProductImportModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<BulkProductRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(null);

  if (!isOpen) return null;

  // 1. Download Sample Excel Template
  function handleDownloadTemplate() {
    const sampleData: BulkProductRow[] = [
      {
        Title: 'Royal Kundan Polki Choker',
        Category: 'Necklaces',
        Price: 14999,
        MRP: 19999,
        Material: '18K Yellow Gold with Uncut Polki',
        Stock: 10,
        Main_Image_Drive_Url: 'https://drive.google.com/file/d/1SAMPLE_DRIVE_FILE_ID_CHOKER_01/view?usp=sharing',
        Gallery_Images: 'https://drive.google.com/file/d/1SAMPLE_DRIVE_FILE_ID_CHOKER_02/view?usp=sharing',
        Description: 'Exquisitely handcrafted bridal choker necklace featuring uncut polki diamonds and fine emerald beads.',
        Available_Sizes: 'Free Size (Adjustable Dori)',
        Certification: 'BIS 916 Hallmarked & Certified',
        Badge: 'Signature',
        SKU: 'SJ-NK-001',
        Is_Featured: 'TRUE',
        Is_New_Arrival: 'TRUE',
      },
      {
        Title: 'Eternal Solitaire Diamond Ring',
        Category: 'Rings',
        Price: 24999,
        MRP: 29999,
        Material: '18K Rose Gold with VVS Solitaire',
        Stock: 15,
        Main_Image_Drive_Url: 'https://drive.google.com/file/d/1SAMPLE_DRIVE_FILE_ID_RING_01/view?usp=sharing',
        Gallery_Images: '',
        Description: 'Timeless luxury solitaire engagement ring designed for refined elegance.',
        Available_Sizes: '12, 14, 16, 18',
        Certification: 'IGI Certified Diamond',
        Badge: 'Best Seller',
        SKU: 'SJ-RN-002',
        Is_Featured: 'TRUE',
        Is_New_Arrival: 'FALSE',
      },
      {
        Title: 'Heritage Peacock Chandbali Earrings',
        Category: 'Earrings',
        Price: 8999,
        MRP: 11999,
        Material: '22K Gold Plated 925 Silver',
        Stock: 8,
        Main_Image_Drive_Url: 'https://drive.google.com/file/d/1SAMPLE_DRIVE_FILE_ID_EARRING_01/view?usp=sharing',
        Gallery_Images: '',
        Description: 'Traditional handcrafted chandbalis inspired by regal Rajasthani peacock motifs.',
        Available_Sizes: 'Standard',
        Certification: 'BIS 925 Hallmark',
        Badge: 'Festive',
        SKU: 'SJ-ER-003',
        Is_Featured: 'FALSE',
        Is_New_Arrival: 'TRUE',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 32 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 32 },
      { wch: 10 },
      { wch: 55 },
      { wch: 55 },
      { wch: 50 },
      { wch: 25 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products_Template');
    XLSX.writeFile(workbook, 'sushi_jewels_product_template.xlsx');
    showToast('Sample Excel template downloaded!', 'success');
  }

  // 2. Parse Uploaded Excel File
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          showToast('The uploaded sheet is empty', 'error');
          return;
        }

        const first = json[0];
        const hasRecognizedHeader = ['Title', 'title', 'Product Name', 'Subcategory', 'Main Category', 'Product No.'].some(
          (header) => header in first
        );
        if (!hasRecognizedHeader) {
          showToast('Invalid Excel format. Could not find a Title, Product Name, Subcategory or Category column.', 'error');
          return;
        }

        const normalized = json.map(normalizeImportRow).filter((row): row is BulkProductRow => row !== null);
        if (normalized.length === 0) {
          showToast('No usable product rows were found in this sheet (every row was missing both an image and a title/subcategory).', 'error');
          return;
        }

        setParsedRows(normalized);
        const skipped = json.length - normalized.length;
        showToast(`Parsed ${normalized.length} products from sheet${skipped > 0 ? ` (${skipped} empty row${skipped === 1 ? '' : 's'} skipped)` : ''}`, 'success');
      } catch (err) {
        console.error('Error parsing sheet:', err);
        showToast('Failed to parse file. Please upload a valid .xlsx or .csv', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // 3. Batch Upload to API
  async function handleStartImport() {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: parsedRows.length });

    const BATCH_SIZE = 4;
    let totalImported = 0;
    let totalFailed = 0;

    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
      const batch = parsedRows.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch('/api/admin/bulk-import-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: batch }),
        });
        const data = await res.json();
        if (data.success) {
          totalImported += data.imported || 0;
          totalFailed += data.failed || 0;
        } else {
          totalFailed += batch.length;
        }
      } catch (err) {
        console.error('Batch import error:', err);
        totalFailed += batch.length;
      }

      const currentDone = Math.min(i + BATCH_SIZE, parsedRows.length);
      setProgress({ current: currentDone, total: parsedRows.length });
    }

    setIsProcessing(false);
    setImportSummary({ imported: totalImported, failed: totalFailed });

    if (totalImported > 0) {
      showToast(`✓ Successfully imported ${totalImported} products!`, 'success');
      onSuccess();
    } else {
      showToast('Import failed. Please check your data & image links.', 'error');
    }
  }

  function handleReset() {
    setParsedRows([]);
    setFileName('');
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E8D5C5] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8D5C5] bg-[#FAF7F2] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8A6F3C]">upload_file</span>
              <h2 className="font-headline text-xl text-[#2D2024] font-semibold">Bulk Import Products (Excel)</h2>
            </div>
            <p className="text-xs text-[#2D2024]/60 mt-0.5">
              Upload an Excel spreadsheet with Google Drive image links. Images will auto-save to Supabase Storage permanently.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Download Template Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8D5C5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">table_chart</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D2024]">Need the Excel Format?</p>
                <p className="text-xs text-[#2D2024]/60">Download our pre-formatted template with all columns and sample rows.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#B99A62] text-[#8A6F3C] hover:bg-[#B99A62]/10 transition-colors shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Download Sample Template (.xlsx)
            </button>
          </div>

          {/* Drive Sharing Notice */}
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs">
            <span className="material-symbols-outlined text-base text-amber-600 flex-shrink-0">info</span>
            <span>
              <strong>Google Drive Note:</strong> Ensure your Google Drive photos are set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong> so our server can download and secure them in your storage.
            </span>
          </div>

          {/* File Upload Zone */}
          {parsedRows.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E8D5C5] hover:border-[#B99A62] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] rounded-2xl p-8 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#E8D5C5] flex items-center justify-center mx-auto text-[#8A6F3C] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#2D2024]">
                Click or Drag & Drop your Excel file here
              </p>
              <p className="text-xs text-[#2D2024]/50 mt-1">
                Supports .xlsx, .xls, and .csv files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#8A6F3C] uppercase tracking-wider">File Selected:</span>
                  <span className="text-sm font-semibold text-[#2D2024] ml-2">{fileName}</span>
                  <span className="text-xs bg-[#B99A62]/15 text-[#8A6F3C] px-2.5 py-0.5 rounded-full font-medium ml-3">
                    {parsedRows.length} Products Found
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Upload Different File
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-[#E8D5C5] rounded-xl overflow-hidden max-h-60 overflow-y-auto text-left">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#E8D5C5] text-[#2D2024]/70 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Image Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D5C5]/60">
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]/40">
                        <td className="py-2 px-3 text-[#2D2024]/50">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-[#2D2024] truncate max-w-[180px]">{row.Title}</td>
                        <td className="py-2 px-3 text-[#2D2024]/70">{row.Category || 'General'}</td>
                        <td className="py-2 px-3 text-[#2D2024]/70 truncate max-w-[140px]">{row.Material || '—'}</td>
                        <td className="py-2 px-3">
                          {row.Main_Image_Drive_Url ? (
                            /drive\.google\.com/.test(row.Main_Image_Drive_Url) ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Drive Link
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Image Link
                              </span>
                            )
                          ) : (
                            <span className="text-amber-600 text-[11px]">No link</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 15 && (
                <p className="text-[11px] text-[#2D2024]/50 italic">
                  Showing first 15 of {parsedRows.length} products. All will be imported.
                </p>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-2 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8D5C5]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2D2024] flex items-center gap-2">
                      <Spinner size={14} />
                      Importing Products & Saving Images to Supabase Storage...
                    </span>
                    <span className="font-bold text-[#8A6F3C]">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-[#E8D5C5] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#B99A62] h-full transition-all duration-300"
                      style={{
                        width: `${Math.round((progress.current / progress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Screen */}
              {importSummary && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-emerald-600">task_alt</span>
                    <span>
                      Import complete! <strong>{importSummary.imported}</strong> products successfully saved to catalog.
                      {importSummary.failed > 0 && ` (${importSummary.failed} failed)`}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-full font-semibold hover:bg-emerald-800"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#E8D5C5] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#2D2024]/70 hover:text-[#2D2024] hover:bg-[#E8D5C5]/40 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          {parsedRows.length > 0 && !importSummary && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] transition-colors uppercase tracking-wider disabled:opacity-50 shadow-md"
            >
              {isProcessing ? (
                <>
                  <Spinner size={16} />
                  <span>Importing ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">cloud_done</span>
                  <span>Start Import ({parsedRows.length} Products)</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
