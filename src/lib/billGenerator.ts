import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Soldier, SoldierBill, MessConfig } from '../types/mess';

export function generateBillPDF(
  soldier: Soldier,
  bill: SoldierBill,
  config: MessConfig,
  billNumber: string
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MESS BILL', pageW / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(config.messName, pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text(config.location, pageW / 2, y, { align: 'center' });
  y += 8;

  // Bill details
  const [year, month] = bill.month.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${config.billPrefix}${billNumber}`, 14, y);
  y += 5;
  doc.text(`Bill pd From 01 ${monthName} to ${getDaysInMonth(parseInt(year), parseInt(month))} ${monthName} ${year}`, 14, y);
  y += 5;
  doc.text('Name :', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${soldier.rank} ${soldier.name}`, 35, y);
  y += 3;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 5;

  // Bill items
  const charges = getBillCharges(bill);
  const tableData = charges.map(c => [c.label, c.amount > 0 ? c.amount.toFixed(2) : '']);

  autoTable(doc, {
    startY: y,
    head: [],
    body: tableData,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 25, halign: 'right' } },
    tableLineWidth: 0,
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 3;

  // Divider before total
  doc.line(14, y, pageW - 14, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total', 14, y);
  doc.text(bill_total(bill).toFixed(2), pageW - 14, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Adv Deposit (Cr Bal)', 14, y);
  doc.text(bill.advDeposit > 0 ? bill.advDeposit.toFixed(2) : '0.00', pageW - 14, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Net Amt', 14, y);
  const netAmt = Math.max(0, bill_total(bill) - bill.advDeposit);
  doc.text(netAmt.toFixed(2), pageW - 14, y, { align: 'right' });
  y += 8;

  // Date & signature
  const today = new Date();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Dated _____ ${monthName.slice(0, 3)} ${year}`, 14, y);
  doc.text('Mess Secy', pageW - 14, y, { align: 'right' });
  y += 8;

  // Footer notes
  doc.setFontSize(7);
  const notes = [
    '(a) Officer will pay the Bill before leaving the Stn',
    '(b) Payment of Bills will not be held up for reasons of observations by officers.',
    '(c) Part Payment will not be accepted.',
    '(d) Rounding off 0.50p and above to the next repee.',
    '(e) Mess bill to be paid in favour of Infantry Officers Mess Fund.',
    '(f) Payment in cash will not be accepted.',
  ];
  for (const note of notes) {
    doc.text(note, 14, y);
    y += 4;
  }

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RECEIPT', pageW / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Received a sum of Rs ____________ in cash/Cheque No ________ dt ________.', 14, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Bankers details for online payment are as under :-', 14, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('SBI, Taurus Stn Canteen IFSC Code : SBIN0062235', 14, y);
  y += 4;
  doc.text('Branch Code : 062235', 14, y);
  y += 4;
  doc.text('Acct No : 41323989149', 14, y);

  doc.save(`bill_${soldier.serviceNumber}_${bill.month}.pdf`);
}

function bill_total(bill: SoldierBill): number {
  const fixed = bill.bbfArrears + bill.teaCoffeeTableMoney + bill.extraMessing +
    bill.barLiqSoftCig + bill.barProfit + bill.laundryCharges +
    bill.birthdayCakeShare + bill.messSubs + bill.mementoSub +
    bill.socialGetTogetherShare + bill.teaRoomBill + bill.misc2;
  const extra = (bill.additionalCharges || []).reduce((s, c) => s + c.amount, 0);
  return fixed + extra;
}

function getBillCharges(bill: SoldierBill) {
  const charges = [
    { label: '', amount: bill.bbfArrears > 0 ? bill.bbfArrears : 500 },
    { label: 'BBF (Previous arrears)', amount: bill.bbfArrears },
    { label: 'Tea/Coffee/ table money', amount: bill.teaCoffeeTableMoney },
    { label: 'Extra Messing', amount: bill.extraMessing },
    { label: 'Bar Liq/ Soft/Cig etc', amount: bill.barLiqSoftCig },
    { label: 'Bar Profit', amount: bill.barProfit },
    { label: 'Laundry Charges', amount: bill.laundryCharges },
    { label: 'Birthday Cake Share', amount: bill.birthdayCakeShare },
    { label: 'Mess Subs', amount: bill.messSubs },
    { label: 'Memento sub', amount: bill.mementoSub },
    { label: 'Social Get Together Share', amount: bill.socialGetTogetherShare },
    { label: 'Tea Room Bill', amount: bill.teaRoomBill },
    { label: 'Misc 2', amount: bill.misc2 },
    { label: 'Round Off', amount: 0 },
  ];
  // Add custom charges
  for (const c of bill.additionalCharges || []) {
    charges.push({ label: c.name, amount: c.amount });
  }
  return charges.slice(1); // remove the blank first row
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function generateAllBillsPDF(
  soldiers: Soldier[],
  bills: Record<string, SoldierBill>,
  config: MessConfig,
  month: string
): void {
  soldiers.forEach((soldier, idx) => {
    const bill = bills[`${soldier.id}-${month}`];
    if (bill) {
      setTimeout(() => {
        generateBillPDF(soldier, bill, config, String(idx + 1).padStart(5, '0'));
      }, idx * 200);
    }
  });
}
