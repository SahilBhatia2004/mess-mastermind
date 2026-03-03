declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: unknown[][];
    body?: unknown[][];
    foot?: unknown[][];
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    styles?: Record<string, unknown>;
    columnStyles?: Record<string | number, Record<string, unknown>>;
    tableLineWidth?: number;
    didParseCell?: (data: { row: { index: number }; cell: { styles: Record<string, unknown> } }) => void;
    [key: string]: unknown;
  }
  
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}
