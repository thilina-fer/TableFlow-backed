import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required").max(20, "Table number must be under 20 characters"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(50, "Capacity must be under 50"),
});

export const updateTableSchema = createTableSchema.partial();
