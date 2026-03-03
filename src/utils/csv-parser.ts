export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string; // ✅ Obligatoire (valeur par défaut : "Non catégorisé")
  subCategory?: string; // ✅ AJOUTÉ : Pour permettre le mapping distinct
  type?: 'online' | 'physical';
  url?: string;
  address?: string;
  brand?: string;
  brandLogo?: string;
  country?: string;
  city?: string;
  continent?: string;
  personId?: string;
  person?: string;
  tags?: string[];
  account?: string;
  notes?: string;
  status?: 'completed' | 'pending' | 'cancelled' | 'upcoming';
  // Subscription fields
  isRecurring?: boolean;
  renewalDate?: string;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  // Recurring group
  recurringGroupId?: string;
}

export interface RecurringGroup {
  id: string;
  transactionIds: string[];
  createdAt: string;
  // Paramètres partagés par toutes les transactions du groupe
  sharedData: {
    category?: string;
    type?: 'online' | 'physical';
    brand?: string;
    url?: string;
    address?: string;
    city?: string;
    country?: string;
    isRecurring: boolean;
    frequency?: 'monthly' | 'quarterly' | 'yearly';
    renewalDate?: string;
  };
}

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Try to detect CSV format (check for tab, comma, or semicolon)
  const header = lines[0];
  let delimiter = ',';
  
  if (header.includes('\t')) {
    delimiter = '\t';
  } else if (header.includes(';')) {
    delimiter = ';';
  } else if (header.includes(',')) {
    delimiter = ',';
  }

  const headers = lines[0].split(delimiter).map(h => 
    h.trim()
      .replace(/"/g, '')
      .toLowerCase() // Normalize to lowercase for easier matching
  );
  
  console.log('🔍 CSV Headers detected:', headers);
  
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    const row: any = {};

    headers.forEach((header, index) => {
      // Store with lowercase key for consistent matching
      row[header] = values[index] || '';
    });
    
    // Map common column names to our format
    const transaction: Transaction = {
      id: generateId(),
      date: extractDate(row),
      description: extractDescription(row),
      amount: extractAmount(row),
      type: extractType(row),
      account: extractAccount(row),
      category: extractCategory(row) || "Non catégorisé", 
      subCategory: extractSubCategory(row), // ✅ CORRECTION : Utilise la nouvelle fonction
      url: extractField(row, ['url', 'link', 'website']),
      address: extractField(row, ['address', 'adresse', 'location']),
      brand: extractField(row, ['brand', 'marque', 'enseigne', 'merchant']),
      brandLogo: extractField(row, ['brandlogo', 'logo', 'brand_logo']),
      country: extractField(row, ['country', 'pays']),
      city: extractField(row, ['city', 'ville']),
      continent: extractField(row, ['continent']),
      person: extractField(row, ['person', 'personne']),
      personId: extractField(row, ['personid', 'person_id']),
      notes: extractField(row, ['notes', 'note', 'comment']),
    };

    transactions.push(transaction);
  }

  console.log(`✅ Parsed ${transactions.length} transactions`);
  return transactions;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function extractField(row: any, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    if (row[key]) {
      return row[key].trim();
    }
  }
  return '';
}

function extractType(row: any): 'online' | 'physical' | undefined {
  const typeKeys = ['type', 'transaction_type', 'type_transaction'];
  
  for (const key of typeKeys) {
    const value = row[key];
    if (value) {
      const normalized = value.toLowerCase().trim();
      if (normalized.includes('online') || normalized.includes('ligne') || normalized === 'online') {
        return 'online';
      }
      if (normalized.includes('physical') || normalized.includes('physique') || normalized === 'physical') {
        return 'physical';
      }
    }
  }

  return undefined;
}

function extractDate(row: any): string {
  const dateKeys = [
    'date operation',
    'date opération',
    'date',
    'transaction date',
    'value date',
    'posting date',
    'datum',
  ];
  
  for (const key of dateKeys) {
    if (row[key]) {
      return normalizeDate(row[key]);
    }
  }
  
  for (const key of Object.keys(row)) {
    if (key.includes('date')) {
      return normalizeDate(row[key]);
    }
  }

  return new Date().toISOString().split('T')[0];
}

function extractDescription(row: any): string {
  const descKeys = [
    'libellé operation',
    'libelle operation',
    'libellé opération',
    'libelle opération',
    'description',
    'libelle',
    'libellé',
    'details',
    'memo',
    'transaction details',
    'payee',
  ];
  
  for (const key of descKeys) {
    if (row[key]) {
      const value = row[key].trim();
      if (value) return value;
    }
  }
  
  for (const key of Object.keys(row)) {
    if (key.includes('libel') && key.includes('operation')) {
      const value = row[key].trim();
      if (value) return value;
    }
  }

  return 'Transaction';
}

function extractAmount(row: any): number {
  const amountKeys = [
    'montant operation',
    'montant opération',
    'amount',
    'montant',
    'debit',
    'credit',
    'value',
    'valeur',
  ];
  
  for (const key of amountKeys) {
    if (row[key] && row[key].toString().trim()) {
      const result = parseAmount(row[key]);
      if (result !== 0) return result;
    }
  }
  
  for (const key of Object.keys(row)) {
    if (key.includes('montant') || key.includes('amount')) {
      const result = parseAmount(row[key]);
      if (result !== 0) return result;
    }
  }

  return 0;
}

// ✅ MODIFIÉ : Ne capture plus les sous-catégories
function extractCategory(row: any): string {
  const categoryKeys = [
    'categorie operation',
    'catégorie operation',
    'catégorie opération',
    'category',
    'categorie',
    'catégorie',
  ];
  
  for (const key of categoryKeys) {
    const value = row[key];
    // On ignore si la clé contient "sous"
    if (value && !key.toLowerCase().includes('sous')) {
      const trimmed = value.trim();
      if (trimmed !== 'À catégoriser' && trimmed !== 'A catégoriser') {
        return trimmed;
      }
    }
  }
  
  for (const key of Object.keys(row)) {
    if ((key.includes('categor') || key.includes('catégor')) && !key.includes('sous')) {
      const value = row[key];
      if (value && value.trim() !== 'À catégoriser' && value.trim() !== 'A catégoriser') {
        return value.trim();
      }
    }
  }

  return '';
}

// ✅ NOUVEAU : Fonction dédiée pour la sous-catégorie
function extractSubCategory(row: any): string {
  const subCategoryKeys = [
    'sous categorie operation',
    'sous catégorie operation',
    'sous catégorie opération',
    'subcategory',
    'sous-categorie',
  ];
  
  for (const key of subCategoryKeys) {
    if (row[key]) return row[key].trim();
  }

  // Fuzzy match
  for (const key of Object.keys(row)) {
    if (key.includes('sous') && (key.includes('categor') || key.includes('catégor'))) {
      return row[key].trim();
    }
  }
  return '';
}

function extractAccount(row: any): string {
  const accountKeys = ['account', 'compte', 'account number', 'numero de compte'];
  for (const key of accountKeys) {
    const value = row[key];
    if (value) return value.trim();
  }
  return '';
}

function parseAmount(value: string): number {
  if (!value) return 0;
  let strValue = value.toString().trim();
  const isNegative = strValue.includes('-');
  let cleaned = strValue
    .replace(/[€$£¥]/g, '')
    .replace(/EUR|USD|GBP|CHF/gi, '')
    .replace(/\s+/g, '') 
    .trim();
  
  if (isNegative && !cleaned.startsWith('-')) {
    cleaned = '-' + cleaned.replace(/-/g, '');
  }

  if (cleaned.includes(',') && cleaned.includes('.')) {
    const sign = cleaned.startsWith('-') ? '-' : '';
    const unsigned = cleaned.replace('-', '');
    cleaned = sign + unsigned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(dateStr: string): string {
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, 
    /(\d{2})\/(\d{2})\/(\d{4})/, 
    /(\d{2})-(\d{2})-(\d{4})/, 
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) return dateStr;
      else return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
  } catch (e) {}

  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}