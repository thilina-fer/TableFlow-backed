import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../../models/AuditLog.model";

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, startDate, endDate, page = 1, limit = 15 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (action) filter.action = action;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const total = await AuditLog.countDocuments(filter);
    const data = await AuditLog.find(filter)
      .populate("performedBy", "name email")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (error) {
    next(error);
  }
};
