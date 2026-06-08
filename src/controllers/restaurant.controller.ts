import { Request, Response, NextFunction } from "express";
import Restaurant from "../models/Restaurant.model";
import { AppError } from "../middleware/errorHandler";
import { sendRegistrationReceivedEmail, sendNewRegistrationAlertEmail } from "../utils/email";

export const registerRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      restaurantType,
      description,
      logoUrl,
      coverImageUrl,
    } = req.body;

    // 1. Check duplicate email registration
    const existing = await Restaurant.findOne({ ownerEmail });
    if (existing) {
      const err = new Error("A registration with this email already exists") as AppError;
      err.statusCode = 409;
      throw err;
    }

    // 2. Create and Save new Restaurant
    const restaurant = new Restaurant({
      name,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      restaurantType,
      description,
      logoUrl,
      coverImageUrl,
      status: "pending",
      isActive: false,
    });

    await restaurant.save();

    // 3. Fire-and-forget emails (do NOT await)
    sendRegistrationReceivedEmail(ownerEmail, ownerName, name).catch(console.error);
    sendNewRegistrationAlertEmail(name, ownerEmail).catch(console.error);

    // 4. Respond
    res.status(201).json({
      success: true,
      message: "Registration submitted successfully. We will review your application and contact you shortly.",
      data: {
        restaurantId: restaurant._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
