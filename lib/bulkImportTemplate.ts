"use client";

import * as XLSX from 'xlsx';

/** Column order doubles as the JSON keys the bulk-import API expects per row. */
export const BULK_IMPORT_HEADERS = [
  'Title',
  'Category',
  'Price',
  'MRP',
  'Material',
  'Stock',
  'Main_Image_Drive_Url',
  'Gallery_Images',
  'Description',
  'Available_Sizes',
  'Certification',
  'Badge',
  'SKU',
  'Is_Featured',
  'Is_New_Arrival',
] as const;

const COLUMN_WIDTHS: Record<(typeof BULK_IMPORT_HEADERS)[number], number> = {
  Title: 32,
  Category: 18,
  Price: 12,
  MRP: 12,
  Material: 30,
  Stock: 10,
  Main_Image_Drive_Url: 55,
  Gallery_Images: 55,
  Description: 45,
  Available_Sizes: 20,
  Certification: 25,
  Badge: 15,
  SKU: 15,
  Is_Featured: 12,
  Is_New_Arrival: 14,
};

const SAMPLE_ROWS: Record<(typeof BULK_IMPORT_HEADERS)[number], string | number>[] = [
  {
    Title: 'Royal Kundan Polki Choker Necklace',
    Category: 'Necklaces',
    Price: 89999,
    MRP: 104999,
    Material: '22K Yellow Gold with Kundan & Polki',
    Stock: 5,
    Main_Image_Drive_Url: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J_EXAMPLE/view?usp=sharing',
    Gallery_Images:
      'https://drive.google.com/file/d/1K2L3M4N5O6P7Q8R9S0T_EXAMPLE/view?usp=sharing, https://drive.google.com/open?id=1U2V3W4X5Y6Z7A8B9C0D_EXAMPLE',
    Description: 'Handcrafted royal bridal choker featuring traditional Kundan and Polki work on 22K gold, perfect for weddings and festive occasions.',
    Available_Sizes: '',
    Certification: 'BIS 916 Hallmark',
    Badge: 'Bridal Exclusive',
    SKU: 'SJ-NK-001',
    Is_Featured: 'TRUE',
    Is_New_Arrival: 'FALSE',
  },
  {
    Title: 'Classic Solitaire Engagement Ring',
    Category: 'Rings',
    Price: 45999,
    MRP: 52999,
    Material: '18K White Gold with Lab-Grown Diamond',
    Stock: 10,
    Main_Image_Drive_Url: 'https://drive.google.com/file/d/1E2F3G4H5I6J7K8L9M0N_EXAMPLE/view?usp=sharing',
    Gallery_Images: 'https://drive.google.com/open?id=1O2P3Q4R5S6T7U8V9W0X_EXAMPLE',
    Description: 'A timeless round-brilliant solitaire set in 18K white gold, designed for the moment that matters most.',
    Available_Sizes: '6, 7, 8, 9, 10',
    Certification: 'IGI Certified',
    Badge: 'Best Seller',
    SKU: 'SJ-RG-014',
    Is_Featured: 'TRUE',
    Is_New_Arrival: 'TRUE',
  },
  {
    Title: 'Pearl Chandbali Earrings',
    Category: 'Earrings',
    Price: 12499,
    MRP: 14999,
    Material: '92.5 Sterling Silver with Freshwater Pearls',
    Stock: 20,
    Main_Image_Drive_Url: 'https://drive.google.com/uc?id=1Y2Z3A4B5C6D7E8F9G0H_EXAMPLE',
    Gallery_Images: '',
    Description: 'Lightweight chandbali earrings with freshwater pearl drops — everyday elegance with a festive edge.',
    Available_Sizes: '',
    Certification: '925 Hallmark',
    Badge: 'New',
    SKU: 'SJ-ER-027',
    Is_Featured: 'FALSE',
    Is_New_Arrival: 'TRUE',
  },
];

/** Builds and downloads sushi_jewels_product_template.xlsx — all in the browser, no server round trip. */
export function downloadBulkImportTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: [...BULK_IMPORT_HEADERS] });
  worksheet['!cols'] = BULK_IMPORT_HEADERS.map((header) => ({ wch: COLUMN_WIDTHS[header] }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, 'sushi_jewels_product_template.xlsx');
}
