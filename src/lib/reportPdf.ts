import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportModel, ReportItem } from './reportModel';
import { formatSize, formatScore } from './format';

export interface GeneratePdfOptions {
  full?: boolean;
}

export function generateReportPdf(model: ReportModel, options: GeneratePdfOptions = {}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // Colors
  const violet = [43, 26, 74];      // #2B1A4A
  const paper = [241, 247, 237];    // #F1F7ED
  const mint = [145, 199, 177];     // #91C7B1
  const crimson = [179, 57, 81];    // #B33951
  const gold = [227, 208, 129];     // #E3D081
  const darkGray = [80, 80, 90];
  const borderGray = [215, 229, 220];

  const KEEP_CAP = options.full ? Infinity : 28;
  const MOVE_CAP = options.full ? Infinity : 20;

  // PAGE 1: Header + Summary + Keep List
  // Header band
  doc.setFillColor(violet[0], violet[1], violet[2]);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  doc.setTextColor(paper[0], paper[1], paper[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Vaultline — Storage report', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${model.generatedAt}`, margin + 6, margin + 14);
  doc.text('Exact Dynamic Programming · Private & Local', pageWidth - margin - 6, margin + 14, { align: 'right' });

  // Summary 2-row grid block
  const summaryTop = margin + 22;
  const summaryHeight = 20;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(margin, summaryTop, pageWidth - margin * 2, summaryHeight, 'FD');

  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.setFontSize(8);

  // Row 1
  const colWidth = (pageWidth - margin * 2) / 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Space given (capacity):', margin + 4, summaryTop + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(model.spaceGivenFormatted, margin + 42, summaryTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Space used:', margin + colWidth + 4, summaryTop + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(model.spaceUsedFormatted, margin + colWidth + 24, summaryTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Space free:', margin + colWidth * 2 + 4, summaryTop + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(model.spaceFreeFormatted, margin + colWidth * 2 + 22, summaryTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Total files:', margin + colWidth * 3 + 4, summaryTop + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${model.totalFilesCount} (${model.totalFilesSizeFormatted})`, margin + colWidth * 3 + 22, summaryTop + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Files kept:', margin + 4, summaryTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${model.keptCount} (${model.keptSizeFormatted})`, margin + 22, summaryTop + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Files moved out:', margin + colWidth + 4, summaryTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${model.movedCount} (${model.movedSizeFormatted})`, margin + colWidth + 30, summaryTop + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Importance retained:', margin + colWidth * 2 + 4, summaryTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${model.importancePercent}% (${model.importanceKept}/${model.importanceTotal})`, margin + colWidth * 2 + 34, summaryTop + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Method:', margin + colWidth * 3 + 4, summaryTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.text('0/1 Knapsack DP', margin + colWidth * 3 + 18, summaryTop + 14);

  // Keep table section title
  const keepSectionTop = summaryTop + summaryHeight + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text(`Files to keep (${model.keptCount} files · ${model.keptSizeFormatted})`, margin, keepSectionTop);

  const keepRows = model.keepItems.slice(0, KEEP_CAP).map((item, idx) => [
    String(idx + 1),
    item.name,
    item.folder,
    formatSize(item.size),
    `${formatScore(item.importance)}/10${item.edited ? ' *' : ''}`,
  ]);

  if (model.keepItems.length > KEEP_CAP) {
    const extra = model.keepItems.length - KEEP_CAP;
    keepRows.push(['...', `+${extra} more files, see the CSV or JSON export`, '', '', '']);
  }

  autoTable(doc, {
    startY: keepSectionTop + 3,
    head: [['#', 'File', 'Folder', 'Size', 'Importance']],
    body: keepRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [240, 245, 242],
      textColor: violet as [number, number, number],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 50],
      cellPadding: 1.5,
      lineColor: [235, 240, 237],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 66 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Thin mint accent on first column of keep rows
      if (data.section === 'body' && data.column.index === 0 && data.row.index < KEEP_CAP) {
        doc.setFillColor(mint[0], mint[1], mint[2]);
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, 'F');
      }
    },
  });

  // PAGE 2: Files to move out + Constraints + Method note
  doc.addPage('a4', 'portrait');

  // Move table section title
  const moveSectionTop = margin + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text(`Files to move out (${model.movedCount} files · ${model.movedSizeFormatted})`, margin, moveSectionTop);

  const moveRows = model.moveItems.slice(0, MOVE_CAP).map((item, idx) => [
    `M${idx + 1}`,
    item.name,
    item.folder,
    formatSize(item.size),
    `${formatScore(item.importance)}/10${item.edited ? ' *' : ''}`,
  ]);

  if (model.moveItems.length > MOVE_CAP) {
    const extra = model.moveItems.length - MOVE_CAP;
    moveRows.push(['...', `+${extra} more files, see the CSV or JSON export`, '', '', '']);
  }

  autoTable(doc, {
    startY: moveSectionTop + 3,
    head: [['#', 'File', 'Folder', 'Size', 'Importance']],
    body: moveRows.length > 0 ? moveRows : [['—', 'No files to move out. Everything fits in capacity.', '', '', '']],
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [248, 240, 242],
      textColor: violet as [number, number, number],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 50],
      cellPadding: 1.5,
      lineColor: [235, 240, 237],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 66 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Thin crimson accent on first column of moved rows
      if (data.section === 'body' && data.column.index === 0 && data.row.index < MOVE_CAP && moveRows.length > 0) {
        doc.setFillColor(crimson[0], crimson[1], crimson[2]);
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, 'F');
      }
    },
  });

  // Constraints & Notes
  const lastY = (doc as any).lastAutoTable?.finalY ?? 160;
  let currentY = lastY + 8;

  if (model.alwaysKeepItems.length > 0 || model.neverKeepItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(violet[0], violet[1], violet[2]);
    doc.text('Constraints:', margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    if (model.alwaysKeepItems.length > 0) {
      const names = model.alwaysKeepItems.map(i => i.name).join(', ');
      doc.text(`Always keep: ${names}`, margin, currentY, { maxWidth: pageWidth - margin * 2 });
      currentY += 5;
    }
    if (model.neverKeepItems.length > 0) {
      const names = model.neverKeepItems.map(i => i.name).join(', ');
      doc.text(`Never keep: ${names}`, margin, currentY, { maxWidth: pageWidth - margin * 2 });
      currentY += 5;
    }
    currentY += 4;
  }

  // Method note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text('Method & Privacy note:', margin, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const notes = [
    '• Exact dynamic programming (O(n × W)) computes the optimal selection for the specified capacity.',
    '• Privacy guarantee: No files or file contents are uploaded. Only metadata (name, size, dates) was processed in your browser.',
    '• Importance scores are suggested by a local heuristic based on file type, age and duplicate detection unless marked with an asterisk (*), which indicates manual user edits.',
    '• For complete list of all files, download the CSV or JSON report.',
  ];
  notes.forEach(note => {
    doc.text(note, margin, currentY, { maxWidth: pageWidth - margin * 2 });
    currentY += 3.5;
  });

  // Page footers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - margin - 3, pageWidth - margin, pageHeight - margin - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Vaultline Storage Report — Page ${i} of ${totalPages}`, margin, pageHeight - margin + 1);
    doc.text(`Generated: ${model.generatedAt}`, pageWidth - margin, pageHeight - margin + 1, { align: 'right' });
  }

  return doc;
}
