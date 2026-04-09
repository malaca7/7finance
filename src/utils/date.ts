export function getLocalDatetimeForInput(val?: string | null): string {
  const d = val ? new Date(val) : new Date();
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function displayLocaleDatetime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  // Se a data vier do banco como "YYYY-MM-DD HH:MM:SS", o JS pode interpretar como UTC.
  // Vamos garantir que seja tratada como string local se não houver fuso.
  let d: Date;
  if (typeof dateStr === 'string' && !dateStr.includes('T') && !dateStr.includes('Z')) {
    d = new Date(dateStr.replace(' ', 'T'));
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) return dateStr;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function displayLocaleDatetimeWithTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr); 
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
