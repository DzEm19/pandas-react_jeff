export type CsvRow = Record<string, string>;

// Representa el CSV despues de leerlo: conserva el nombre original, el orden
// de encabezados y cada fila como un mapa de valores de texto.
export type ParsedCsv = {
  fileName: string;
  headers: string[];
  rows: CsvRow[];
  totalRows?: number;
};

export const CSV_PREVIEW_LIMIT = 25;

export const CSV_STORAGE_KEY = 'dashboard-csv-upload';
export const CSV_HISTORY_KEY = 'dashboard-csv-history';
export const DOCUMENTATION_KEY = 'dashboard-documentation';

// El historial guarda solo informacion de control para no duplicar el archivo
// completo en localStorage.
export type CsvHistoryEntry = {
  id: string;
  fileName: string;
  insertedAt: string;
  rows: number;
  columns: number;
};

export type DocumentationCsvEntry = {
  id: string;
  fileName: string;
  insertedAt: string;
  size: number;
  source: 'documentation';
  csv: ParsedCsv;
};

export const parseCsvText = (text: string): { headers: string[]; rows: CsvRow[] } => {
  // Normaliza saltos de linea y elimina registros vacios antes de interpretar
  // la primera linea como encabezados del archivo.
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
  // Se usa punto y coma solo cuando parece ser el separador exclusivo de la
  // cabecera; en cualquier otro caso se mantiene la coma como valor por defecto.
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const parseLine = (line: string): string[] => {
    // El recorrido manual conserva delimitadores dentro de comillas y convierte
    // dos comillas consecutivas en una comilla literal.
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
  // Garantiza nombres para cabeceras vacias y rellena con '' las celdas que no
  // existan en una fila para que todas las filas compartan el mismo contrato.
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
  // Lee el CSV activo de sessionStorage y valida su forma antes de entregarlo a
  // React. Este es el punto de entrada de las vistas que se montan despues.
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
  // Serializa el archivo completo; sessionStorage lo mantiene mientras viva la
  // sesion de la pestaña, no en un servidor ni en una base de datos.
  sessionStorage.setItem(CSV_STORAGE_KEY, JSON.stringify(data));
};

export const loadCsvHistory = (): CsvHistoryEntry[] => {
  // Recupera metadatos persistentes del navegador y devuelve una lista vacia si
  // aun no existe historial o su JSON no puede utilizarse.
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
  // Funcion interna para centralizar la serializacion del historial.
  localStorage.setItem(CSV_HISTORY_KEY, JSON.stringify(history));
};

export const clearCsvHistory = () => {
  localStorage.removeItem(CSV_HISTORY_KEY);
};

export const loadDocumentationCsv = (): DocumentationCsvEntry[] => {
  try {
    const saved = localStorage.getItem(DOCUMENTATION_KEY);
    if (!saved) return [];

    const entries = JSON.parse(saved) as DocumentationCsvEntry[];
    return Array.isArray(entries) ? entries.filter((entry) => entry.source === 'documentation') : [];
  } catch {
    return [];
  }
};

const saveDocumentationCsv = (entries: DocumentationCsvEntry[]) => {
  localStorage.setItem(DOCUMENTATION_KEY, JSON.stringify(entries));
};

export const addCsvToDocumentation = (data: ParsedCsv, size = 0) => {
  const entry: DocumentationCsvEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: data.fileName,
    insertedAt: new Date().toISOString(),
    size,
    source: 'documentation',
    csv: {
      ...data,
      rows: data.rows.slice(0, CSV_PREVIEW_LIMIT),
      totalRows: data.totalRows ?? data.rows.length,
    },
  };
  saveDocumentationCsv([entry, ...loadDocumentationCsv()]);
  return entry;
};

export const removeCsvFromDocumentation = (id: string) => {
  saveDocumentationCsv(loadDocumentationCsv().filter((entry) => entry.id !== id));
};

export const addCsvToHistory = (data: ParsedCsv) => {
  // Anteponer el archivo nuevo conserva el orden mas reciente primero. Solo se
  // guardan metadatos, por lo que el historial tiene un ciclo de vida distinto.
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
  // Orquesta el flujo completo de carga: API File del navegador, parser,
  // validacion minima, persistencia del activo e insercion en el historial.
  const text = await file.text();
  const parsed = parseCsvText(text);

  if (parsed.headers.length === 0) {
    return null;
  }

  const result: ParsedCsv = {
    fileName: file.name,
    headers: parsed.headers,
    rows: parsed.rows,
    totalRows: parsed.rows.length,
  };

  // Conserva el archivo completo en memoria para el análisis actual, pero solo
  // persiste la vista previa para evitar superar el límite de sessionStorage.
  saveUploadedCsv({
    ...result,
    rows: parsed.rows.slice(0, CSV_PREVIEW_LIMIT),
  });
  addCsvToHistory(result);
  return result;
};
