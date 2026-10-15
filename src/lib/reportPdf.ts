import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportModel, ReportItem } from './reportModel';
import { formatSize, formatScore } from './format';

export interface GeneratePdfOptions {
  full?: boolean;
}

export function generateReportPdf(model: ReportModel, _options: GeneratePdfOptions = {}): jsPDF {
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

  const KEEP_CAP = model.keepItems.length;
  const MOVE_CAP = model.moveItems.length;

  // PAGE 1: Executive summary
  // Header band
  doc.setFillColor(violet[0], violet[1], violet[2]);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  doc.setTextColor(paper[0], paper[1], paper[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Storage optimization report', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${model.generatedAt}`, margin + 6, margin + 14);
  doc.text('Vaultline | Private and local', pageWidth - margin - 6, margin + 14, { align: 'right' });

  // Summary grid: readable labels and values with consistent spacing.
  const summaryTop = margin + 22;
  const summaryGap = 2;
  const summaryCardHeight = 19;
  const summaryHeight = summaryCardHeight * 2 + summaryGap;
  const summaryWidth = pageWidth - margin * 2;
  const summaryCardWidth = (summaryWidth - summaryGap * 2) / 3;
  const summaryCards = [
    ['TARGET CAPACITY', model.spaceGivenFormatted],
    ['FILES ANALYZED', `${model.totalFilesCount} files | ${model.totalFilesSizeFormatted}`],
    ['SPACE USED', model.spaceUsedFormatted],
    ['SPACE AVAILABLE', model.spaceFreeFormatted],
    ['FILES KEPT', `${model.keptCount} files | ${model.keptSizeFormatted}`],
    ['FILES MOVED OUT', `${model.movedCount} files | ${model.movedSizeFormatted}`],
  ];
  summaryCards.forEach(([label, value], index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const x = margin + column * (summaryCardWidth + summaryGap);
    const y = summaryTop + row * (summaryCardHeight + summaryGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, y, summaryCardWidth, summaryCardHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(label, x + 2.5, y + 4.5);
    doc.setTextColor(violet[0], violet[1], violet[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const valueLines = doc.splitTextToSize(value, summaryCardWidth - 5);
    doc.text(valueLines.slice(0, 2), x + 2.5, y + 11, { lineHeightFactor: 1.1 });
  });

  let summaryY = summaryTop + summaryHeight + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text('Optimization outcome', margin, summaryY);
  summaryY += 7;
  doc.setFillColor(248, 246, 250);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, summaryY, summaryWidth, 29, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text(`${model.importancePercent}%`, margin + 5, summaryY + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`of total importance retained (${model.importanceKept} of ${model.importanceTotal})`, margin + 5, summaryY + 17);
  doc.setFillColor(225, 229, 232);
  doc.roundedRect(margin + 5, summaryY + 21, summaryWidth - 10, 3, 1.5, 1.5, 'F');
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(margin + 5, summaryY + 21, Math.max(1, (summaryWidth - 10) * model.importancePercent / 100), 3, 1.5, 1.5, 'F');
  summaryY += 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Plan summary', margin, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const summaryText = `The selected plan keeps ${model.keptCount} of ${model.totalFilesCount} files and uses ${model.spaceUsedFormatted} of the ${model.spaceGivenFormatted} target. ${model.movedCount} files (${model.movedSizeFormatted}) are moved out, leaving ${model.spaceFreeFormatted} available.`;
  doc.text(doc.splitTextToSize(summaryText, summaryWidth), margin, summaryY + 6, { lineHeightFactor: 1.35 });
  doc.setFontSize(8.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Exact dynamic programming | Runtime: ${model.solverRuntimeMs > 0 ? `${model.solverRuntimeMs.toFixed(2)} ms` : 'not measured'}`, margin, summaryY + 22);

  // PAGE 2: Complete kept-file list
  doc.addPage('a4', 'portrait');
  const keepSectionTop = margin + 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text(`Files kept - ${model.keptCount} files`, margin, keepSectionTop);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total size: ${model.keptSizeFormatted} | Importance scores are out of 10; * marks a manually edited score.`, margin, keepSectionTop + 6);

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
    startY: keepSectionTop + 10,
    head: [['#', 'File name', 'Folder', 'Size', 'Score / 10']],
    body: keepRows,
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [240, 245, 242],
      textColor: violet as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 50],
      cellPadding: 2,
      lineColor: [235, 240, 237],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 60 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 24, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Thin mint accent on first column of keep rows
      if (data.section === 'body' && data.column.index === 0 && data.row.index < KEEP_CAP) {
        doc.setFillColor(mint[0], mint[1], mint[2]);
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, 'F');
      }
    },
  });

  // PAGE 3: Complete moved-file list
  doc.addPage('a4', 'portrait');

  // Move table section title
  const moveSectionTop = margin + 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text(`Files moved out - ${model.movedCount} files`, margin, moveSectionTop);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total size: ${model.movedSizeFormatted} | These files are outside the selected storage plan.`, margin, moveSectionTop + 6);

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
    startY: moveSectionTop + 10,
    head: [['#', 'File name', 'Folder', 'Size', 'Score / 10']],
    body: moveRows.length > 0 ? moveRows : [['-', 'No files to move out. Everything fits in capacity.', '', '', '']],
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [248, 240, 242],
      textColor: violet as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.2,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 50],
      cellPadding: 2,
      lineColor: [235, 240, 237],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 60 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 24, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Thin crimson accent on first column of moved rows
      if (data.section === 'body' && data.column.index === 0 && data.row.index < MOVE_CAP && moveRows.length > 0) {
        doc.setFillColor(crimson[0], crimson[1], crimson[2]);
        doc.rect(data.cell.x, data.cell.y, 1.2, data.cell.height, 'F');
      }
    },
  });

  // Constraints and notes follow the complete moved-file table and may continue on new pages.
  let currentY = (doc as any).lastAutoTable?.finalY ?? margin + 8;
  const constraintRows = [
    ...model.alwaysKeepItems.map(item => ['Always keep', item.name, formatSize(item.size)]),
    ...model.neverKeepItems.map(item => ['Never keep', item.name, formatSize(item.size)]),
  ];

  if (constraintRows.length > 0) {
    if (currentY + 24 > pageHeight - margin - 10) {
      doc.addPage('a4', 'portrait');
      currentY = margin + 8;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(violet[0], violet[1], violet[2]);
    doc.text('Constraints', margin, currentY + 4);
    autoTable(doc, {
      startY: currentY + 7,
      head: [['Rule', 'File', 'Size']],
      body: constraintRows,
      theme: 'plain',
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [240, 245, 242], textColor: violet as [number, number, number], fontStyle: 'bold', fontSize: 9, lineColor: borderGray as [number, number, number], lineWidth: 0.2 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 50], cellPadding: 2, lineColor: [235, 240, 237], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 130 }, 2: { cellWidth: 24, halign: 'right' } },
    });
    currentY = ((doc as any).lastAutoTable?.finalY ?? currentY) + 7;
  }

  if (currentY + 34 > pageHeight - margin - 10) {
    doc.addPage('a4', 'portrait');
    currentY = margin + 8;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(violet[0], violet[1], violet[2]);
  doc.text('Method and privacy', margin, currentY + 4);

  const notes = [
    'Exact dynamic programming (O(n x W)) computes the optimal selection for the specified capacity.',
    'Privacy: No files or file contents are uploaded. Only file metadata was processed in your browser.',
    'Importance scores use a local heuristic unless marked with an asterisk, which indicates a manual edit.',
    'This PDF lists every kept and moved file. CSV and JSON exports are also available.',
  ];
  autoTable(doc, {
    startY: currentY + 7,
    body: notes.map(note => [note]),
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: darkGray as [number, number, number], cellPadding: { top: 1.5, right: 1, bottom: 1.5, left: 0 }, overflow: 'linebreak', lineColor: [255, 255, 255], lineWidth: 0 },
    columnStyles: { 0: { cellWidth: pageWidth - margin * 2 } },
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
    doc.text(`Vaultline Storage Report - Page ${i} of ${totalPages}`, margin, pageHeight - margin + 1);
    doc.text(`Generated: ${model.generatedAt}`, pageWidth - margin, pageHeight - margin + 1, { align: 'right' });
  }

  return doc;
}
