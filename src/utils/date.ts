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
  
  // Tratar data como string local sem conversão de fuso
  let d: Date;
  const dateStrClean = dateStr.replace(' ', 'T');
  
  // Se tem timezone info (Z ou +HH:MM), usar Date diretamente
  // Caso contrário, tratar como local
  if (dateStrClean.endsWith('Z') || dateStrClean.includes('+') || dateStrClean.includes('-')) {
    d = new Date(dateStrClean);
  } else {
    // Parse manual para evitar problema de fuso
    const parts = dateStrClean.split(/[-T:]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const hours = parts[3] ? parseInt(parts[3]) : 0;
      const minutes = parts[4] ? parseInt(parts[4]) : 0;
      d = new Date(year, month, day, hours, minutes);
    } else {
      d = new Date(dateStrClean);
    }
  }

  if (isNaN(d.getTime())) return dateStr;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function displayLocaleDatetimeWithTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  const dateStrClean = dateStr.replace(' ', 'T');
  
  let d: Date;
  if (dateStrClean.endsWith('Z') || dateStrClean.includes('+') || dateStrClean.includes('-')) {
    d = new Date(dateStrClean);
  } else {
    const parts = dateStrClean.split(/[-T:]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const hours = parts[3] ? parseInt(parts[3]) : 0;
      const minutes = parts[4] ? parseInt(parts[4]) : 0;
      d = new Date(year, month, day, hours, minutes);
    } else {
      d = new Date(dateStrClean);
    }
  }
  
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}