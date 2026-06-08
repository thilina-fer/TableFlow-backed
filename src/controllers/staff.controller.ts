import { Request, Response, NextFunction } from "express";
import User from "../models/User.model";
import Restaurant from "../models/Restaurant.model";
import { AppError } from "../middleware/errorHandler";
import { generateTempPassword, hashPassword } from "../utils/password";
import { sendStaffWelcomeEmail, sendEmail } from "../utils/email";

export const getStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;

    const staff = await User.find({ restaurantId }).select("-passwordHash");

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { name, email, role } = req.body;

    // 1. Check duplicate email globally (since email unique: true in DB)
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error("Email already in use") as AppError;
      err.statusCode = 409;
      throw err;
    }

    // 2. Generate and hash temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    // 3. Find restaurant name for the email
    const restaurant = await Restaurant.findById(restaurantId);
    const restaurantName = restaurant ? restaurant.name : "your restaurant";

    // 4. Create User
    const staffMember = await User.create({
      restaurantId,
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      isFirstLogin: true,
    });

    // 5. Fire-and-forget welcome email (do NOT await)
    sendStaffWelcomeEmail(email, name, restaurantName, tempPassword).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Staff member created",
      data: {
        _id: staffMember._id.toString(),
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const updated = await User.findOneAndUpdate(
      { _id: id, restaurantId },
      req.body,
      { new: true }
    ).select("-passwordHash");

    if (!updated) {
      const err = new Error("Staff member not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    // Cannot deactivate own account
    if (id === currentUserId) {
      const err = new Error("Cannot deactivate your own account") as AppError;
      err.statusCode = 400;
      throw err;
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, restaurantId },
      { isActive: false },
      { new: true }
    ).select("-passwordHash");

    if (!updated) {
      const err = new Error("Staff member not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      message: "Staff member deactivated",
    });
  } catch (error) {
    next(error);
  }
};

export const resetStaffPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const staff = await User.findOne({ _id: id, restaurantId });
    if (!staff) {
      const err = new Error("Staff member not found") as AppError;
      err.statusCode = 404;
      throw err;
    }

    // 1. Generate and hash new temp password
    const tempPassword = generateTempPassword();
    staff.passwordHash = await hashPassword(tempPassword);
    staff.isFirstLogin = true;
    await staff.save();

    // 2. Find restaurant name for the email
    const restaurant = await Restaurant.findById(restaurantId);
    const restaurantName = restaurant ? restaurant.name : "your restaurant";

    // 3. Fire-and-forget new password email (do NOT await)
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #c0392b;">Password Reset Notification</h2>
        <p>Hello ${staff.name},</p>
        <p>Your TableFlow staff account password for <strong>${restaurantName}</strong> has been reset by your administrator.</p>
        <p>Use the temporary password below to log in next time:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #e74c3c;">
          <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${staff.email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="font-size: 1.2em; color: #e74c3c;">${tempPassword}</code></p>
        </div>
        <p style="color: #7f8c8d;"><em>You will be required to change your password immediately upon logging in.</em></p>
        <p>Best regards,<br/>The TableFlow Support Team</p>
      </div>
    `;
    sendEmail(staff.email, "TableFlow — Staff Password Reset", emailHtml).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Password reset. Staff member will be required to change password on next login.",
    });
  } catch (error) {
    next(error);
  }
};
