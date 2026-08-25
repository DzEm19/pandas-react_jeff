export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  fileName: string;
  headers: string[];
  rows: CsvRow[];
};

export const CSV_STORAGE_KEY = 'dashboard-csv-upload';
export const CSV_HISTORY_KEY = 'dashboard-csv-history';

export type CsvHistoryEntry = {
  id: string;
  fileName: string;
  insertedAt: string;
  rows: number;
  columns: number;
};

export const parseCsvText = (text: string): { headers: string[]; rows: CsvRow[] } => {
  // Este parser cubre CSV de una linea por registro, con coma o punto y coma,
  // y respeta delimitadores dentro de valores entre comillas.
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!cleaned) {
    return { headers: [], rows: [] };
  }

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const parseLine = (line: string): string[] => {
    // Se recorre caracter por caracter porque dividir directamente por el
    // delimitador romperia valores como "Ciudad, Estado".
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const rawRows = lines.map(parseLine);
  const headers = rawRows[0].map((header, index) => (header || `columna_${index + 1}`).trim());
  const rows = rawRows.slice(1).map((values) => {
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });

  return { headers, rows };
};

export const loadUploadedCsv = (): ParsedCsv | null => {
  // La validacion minima evita que un JSON invalido o con otra estructura
  // llegue a los componentes que esperan headers y rows.
  try {
    const saved = sessionStorage.getItem(CSV_STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as ParsedCsv;
    if (!parsed || !Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveUploadedCsv = (data: ParsedCsv) => {
  sessionStorage.setItem(CSV_STORAGE_KEY, JSON.stringify(data));
};

export const loadCsvHistory = (): CsvHistoryEntry[] => {
  try {
    const saved = localStorage.getItem(CSV_HISTORY_KEY);
    if (!saved) return [];

    const history = JSON.parse(saved) as CsvHistoryEntry[];
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
};

const saveCsvHistory = (history: CsvHistoryEntry[]) => {
  localStorage.setItem(CSV_HISTORY_KEY, JSON.stringify(history));
};

export const addCsvToHistory = (data: ParsedCsv) => {
  // El historial conserva metadatos, no el contenido del CSV, para mantenerlo
  // ligero y permitir que el archivo activo tenga un ciclo de vida distinto.
  const history: CsvHistoryEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: data.fileName,
      insertedAt: new Date().toISOString(),
      rows: data.rows.length,
      columns: data.headers.length,
    },
    ...loadCsvHistory(),
  ];
  saveCsvHistory(history);
};

export const readCsvFromFile = async (file: File): Promise<ParsedCsv | null> => {
  // Es la entrada principal de una carga: lee, interpreta, valida y persiste
  // el archivo antes de devolverlo al estado de la pantalla.
  const text = await file.text();
  const parsed = parseCsvText(text);

  if (parsed.headers.length === 0) {
    return null;
  }

  const result: ParsedCsv = {
    fileName: file.name,
    headers: parsed.headers,
    rows: parsed.rows,
  };

  saveUploadedCsv(result);
  addCsvToHistory(result);
  return result;
};
