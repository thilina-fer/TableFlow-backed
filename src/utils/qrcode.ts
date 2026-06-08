import QRCode from "qrcode";
import { env } from "../config/env";

export const generateQRCodeBase64 = async (
  tableId: string,
  restaurantId: string
): Promise<string> => {
  const url = `${env.FRONTEND_URL}/menu?table=${tableId}&restaurant=${restaurantId}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
  });
};
