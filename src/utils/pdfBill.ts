import PDFDocument from "pdfkit";
import { IOrder } from "../models/Order.model";

export const generateReceiptPDF = (
  order: IOrder,
  restaurantName: string,
  tableNumber: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: "A6" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.font("Helvetica-Bold").fontSize(14).text(restaurantName, { align: "center" });
      doc.font("Helvetica").fontSize(8).text("TableFlow POS Receipt", { align: "center" });
      doc.moveDown(1);

      // Metadata
      doc.fontSize(8);
      doc.font("Helvetica-Bold").text("Order ID: ", { continued: true }).font("Helvetica").text((order._id as any).toString());
      doc.font("Helvetica-Bold").text("Table: ", { continued: true }).font("Helvetica").text(tableNumber);
      doc.font("Helvetica-Bold").text("Date: ", { continued: true }).font("Helvetica").text(new Date(order.createdAt).toLocaleString());
      doc.font("Helvetica-Bold").text("Payment Method: ", { continued: true }).font("Helvetica").text(order.paymentMethod.toUpperCase());
      doc.moveDown(0.5);

      // Divider Line
      doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).strokeColor("#cccccc").lineWidth(1).stroke();
      doc.moveDown(0.5);

      // Table Headers
      const startX = 30;
      const colWidths = {
        name: 120,
        qty: 30,
        price: 50,
        total: 55,
      };

      const yHeaders = doc.y;
      doc.font("Helvetica-Bold").fontSize(8);
      doc.text("Item Description", startX, yHeaders);
      doc.text("Qty", startX + colWidths.name, yHeaders, { align: "right", width: colWidths.qty });
      doc.text("Price", startX + colWidths.name + colWidths.qty, yHeaders, { align: "right", width: colWidths.price });
      doc.text("Total", startX + colWidths.name + colWidths.qty + colWidths.price, yHeaders, { align: "right", width: colWidths.total });
      doc.moveDown(0.3);

      doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).strokeColor("#eeeeee").lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      // Line Items
      doc.font("Helvetica").fontSize(8);
      order.items.forEach((item) => {
        const currentY = doc.y;
        
        // Wrap the description to avoid overlapping other fields
        doc.text(item.name, startX, currentY, { width: colWidths.name });
        
        doc.text(item.quantity.toString(), startX + colWidths.name, currentY, {
          align: "right",
          width: colWidths.qty,
        });
        doc.text(`$${item.price.toFixed(2)}`, startX + colWidths.name + colWidths.qty, currentY, {
          align: "right",
          width: colWidths.price,
        });
        doc.text(`$${item.subtotal.toFixed(2)}`, startX + colWidths.name + colWidths.qty + colWidths.price, currentY, {
          align: "right",
          width: colWidths.total,
        });

        doc.moveDown(0.3);
      });

      doc.moveDown(0.2);
      doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).strokeColor("#cccccc").lineWidth(1).stroke();
      doc.moveDown(0.5);

      // Financials
      const endAlignX = startX + colWidths.name + colWidths.qty;
      const rightColWidth = colWidths.price + colWidths.total;

      const subtotalY = doc.y;
      doc.font("Helvetica-Bold").text("Subtotal:", endAlignX, subtotalY, { align: "left" });
      doc.font("Helvetica").text(`$${order.subtotal.toFixed(2)}`, endAlignX, subtotalY, { align: "right", width: rightColWidth });
      doc.moveDown(0.2);

      const taxY = doc.y;
      doc.font("Helvetica-Bold").text("Tax:", endAlignX, taxY, { align: "left" });
      doc.font("Helvetica").text(`$${order.taxAmount.toFixed(2)}`, endAlignX, taxY, { align: "right", width: rightColWidth });
      doc.moveDown(0.2);

      const totalY = doc.y;
      doc.font("Helvetica-Bold").fontSize(9).text("Total Amount:", endAlignX, totalY, { align: "left" });
      doc.text(`$${order.totalAmount.toFixed(2)}`, endAlignX, totalY, { align: "right", width: rightColWidth });
      doc.moveDown(1.5);

      // Footer
      doc.font("Helvetica-Oblique").fontSize(8).text("Thank you for dining with us!", { align: "center" });
      doc.text("Powered by TableFlow", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
