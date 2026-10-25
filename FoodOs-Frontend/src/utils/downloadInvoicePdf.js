import { jsPDF } from 'jspdf';

const money = (value) => `INR ${(Number(value) || 0).toFixed(2)}`;

export const downloadInvoicePdf = (order) => {
  if (!order) {
    console.warn('downloadInvoicePdf: no order provided');
    return false;
  }

  try {
    const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - 14;
  let y = 18;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 14) {
      pdf.addPage();
      y = 18;
    }
  };
  const addLine = (label, value, bold = false) => {
    ensureSpace(7);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.text(String(label), left, y);
    pdf.text(String(value ?? '-'), right, y, { align: 'right' });
    y += 7;
  };
  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-IN');
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(order.restaurantName || 'FoodOS', left, y);
  y += 9;
  pdf.setFontSize(14);
  pdf.text('INVOICE', left, y);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Order #${order.orderNumber || order.orderUuid?.slice(0, 8) || '-'}`, right, y, { align: 'right' });
  y += 8;
  pdf.setDrawColor(190);
  pdf.line(left, y, right, y);
  y += 8;

  addLine('Date', formatDate(order.orderTime || order.orderDate));
  addLine('Order type', order.orderType?.replaceAll('_', ' ') || '-');
  addLine('Table', order.tableNumber || '-');
  addLine('Customer', order.customerName || 'Walk-in');
  if (order.customerPhone) addLine('Phone', order.customerPhone);
  y += 2;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Item', left, y);
  pdf.text('Qty', 132, y, { align: 'right' });
  pdf.text('Unit', 162, y, { align: 'right' });
  pdf.text('Amount', right, y, { align: 'right' });
  y += 3;
  pdf.line(left, y, right, y);
  y += 6;

  const activeItems = (order.items || []).filter((item) => (
    !item.isCancelled && item.kotStatus !== 'CANCELLED' && item.status !== 'CANCELLED'
  ));
  activeItems.forEach((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const modifiersTotal = (item.modifiers || []).reduce((sum, modifier) => (
      sum + Number(modifier.lineTotal || (modifier.priceAdd || modifier.unitPrice || 0) * (modifier.quantity || 1))
    ), 0);
    const itemTotal = Number(item.lineTotal ?? (unitPrice * quantity + modifiersTotal));
    const name = [item.productName || item.name || 'Item', item.variationName]
      .filter(Boolean)
      .join(' - ');
    const itemLines = pdf.splitTextToSize(name, 78);
    ensureSpace(Math.max(8, itemLines.length * 5) + (item.modifiers?.length ? 5 : 0));
    pdf.setFont('helvetica', 'normal');
    pdf.text(itemLines, left, y);
    pdf.text(String(quantity), 132, y, { align: 'right' });
    pdf.text(money(unitPrice), 162, y, { align: 'right' });
    pdf.text(money(itemTotal), right, y, { align: 'right' });
    y += Math.max(7, itemLines.length * 5);
    if (item.modifiers?.length) {
      const modifierText = item.modifiers.map((modifier) => `+ ${modifier.modifierName || modifier.name}`).join(', ');
      const modifierLines = pdf.splitTextToSize(modifierText, 100);
      ensureSpace(modifierLines.length * 4);
      pdf.setFontSize(8);
      pdf.text(modifierLines, left + 2, y);
      pdf.setFontSize(10);
      y += modifierLines.length * 4;
    }
  });

  y += 3;
  ensureSpace(10);
  pdf.line(left, y, right, y);
  y += 7;
  addLine('Subtotal', money(order.subtotal));
  if (order.discountAmount > 0) addLine('Discount', `-${money(order.discountAmount)}`);
  if (order.taxAmount > 0) addLine('Tax', money(order.taxAmount));
  if (order.serviceCharge > 0) addLine('Service charge', money(order.serviceCharge));
  if (order.deliveryCharge > 0) addLine('Delivery charge', money(order.deliveryCharge));
  if (order.packingCharge > 0) addLine('Packing charge', money(order.packingCharge));
  if (order.tipAmount > 0) addLine('Tip', money(order.tipAmount));
  addLine('Total', money(order.totalAmount), true);
  addLine('Paid', money(order.paidAmount));
  addLine('Balance due', money(order.balanceAmount), true);
  if (order.couponCode) addLine('Coupon', order.couponCode);

  const filename = `invoice-${String(order.orderNumber || order.orderUuid || 'order').replace(/[^a-z0-9_-]/gi, '-')}.pdf`;
  pdf.save(filename);
  return true;
} catch (err) {
  console.error('Failed to generate or download invoice PDF:', err);
  try {
    window.print();
  } catch (printErr) {
    console.warn('Fallback window.print() failed:', printErr);
  }
  return false;
}
};
