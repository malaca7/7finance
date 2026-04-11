export function getLocalDatetimeForInput(val?: string | null): string {
  if (!val) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Se já for uma data de input (YYYY-MM-DDTHH:mm), retorna como está
  if (val.includes('T') && val.length >= 16 && !val.endsWith('Z')) {
    return val.substring(0, 16);
  }

  const d = parseLocalDate(val);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseLocalDate(dateStr: string): Date {
  // Formato do banco PostgreSQL: "2026-04-10 10:00:00" ou "2026-04-10T10:00:00"
  // Treat as local time, not UTC
  const cleanDate = dateStr.replace(' ', 'T').split('.')[0];
  
  const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  
  if (match) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
    // month é 1-indexed no input, mas Date() usa 0-indexed
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
  }
  
  // Fallback
  return new Date(cleanDate);
}

export function displayLocaleDatetime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  try {
    const d = parseLocalDate(dateStr);
    
    if (isNaN(d.getTime())) return dateStr;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function displayLocaleDatetimeWithTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  try {
    const d = parseLocalDate(dateStr);
    
    if (isNaN(d.getTime())) return dateStr;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}