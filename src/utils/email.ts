import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: env.SMTP_PORT === "465", // secure for 465, false for other ports like 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✉️ Email successfully sent to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

export const sendRegistrationReceivedEmail = async (
  ownerEmail: string,
  ownerName: string,
  restaurantName: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Hello ${ownerName},</h2>
      <p>Thank you for registering <strong>${restaurantName}</strong> with TableFlow!</p>
      <p>We have successfully received your application. Our team is currently reviewing the details, and we will get back to you shortly with an status update.</p>
      <p>Best regards,<br/>The TableFlow Team</p>
    </div>
  `;
  // fire-and-forget inside callers, but we will return the promise so we can choose to await if needed,
  // or catch it. Since caller uses .catch(console.error), we can just return sendEmail's promise.
  return sendEmail(ownerEmail, "TableFlow — Registration Received", html);
};

export const sendNewRegistrationAlertEmail = async (
  restaurantName: string,
  ownerEmail: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">New Restaurant Registration Alert</h2>
      <p>A new restaurant has submitted a registration application:</p>
      <ul>
        <li><strong>Restaurant Name:</strong> ${restaurantName}</li>
        <li><strong>Owner Email:</strong> ${ownerEmail}</li>
      </ul>
      <p>Please log in to the Super Admin panel to review and approve or reject this request.</p>
    </div>
  `;
  return sendEmail(env.SUPERADMIN_EMAIL, "TableFlow — New Restaurant Registration", html);
};

export const sendApprovalEmail = async (
  ownerEmail: string,
  ownerName: string,
  restaurantName: string,
  tempPassword: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50; color: #27ae60;">Congratulations ${ownerName}!</h2>
      <p>Your restaurant <strong>${restaurantName}</strong> has been approved for TableFlow!</p>
      <p>You can now log in to the portal using the credentials below:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #27ae60;">
        <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${ownerEmail}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="font-size: 1.2em; color: #e74c3c;">${tempPassword}</code></p>
      </div>
      <p style="color: #7f8c8d;"><em>Important: For security reasons, please log in and change your password immediately upon your first login.</em></p>
      <p>Best regards,<br/>The TableFlow Team</p>
    </div>
  `;
  return sendEmail(ownerEmail, "TableFlow — Your Restaurant Has Been Approved!", html);
};

export const sendRejectionEmail = async (
  ownerEmail: string,
  ownerName: string,
  restaurantName: string,
  reason: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Hello ${ownerName},</h2>
      <p>Thank you for your interest in TableFlow. We have reviewed your application for <strong>${restaurantName}</strong>.</p>
      <p>Unfortunately, we are unable to approve your application at this time due to the following reason:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #e74c3c;">
        <p style="margin: 0; color: #c0392b;">${reason}</p>
      </div>
      <p>If you have any questions or would like to submit additional information, please reply to this email.</p>
      <p>Best regards,<br/>The TableFlow Team</p>
    </div>
  `;
  return sendEmail(ownerEmail, "TableFlow — Registration Update", html);
};

export const sendSuspensionEmail = async (
  ownerEmail: string,
  ownerName: string,
  restaurantName: string,
  reason: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #c0392b;">Account Suspended</h2>
      <p>Hello ${ownerName},</p>
      <p>Please be notified that your TableFlow restaurant account for <strong>${restaurantName}</strong> has been suspended due to the following reason:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #e74c3c;">
        <p style="margin: 0; color: #c0392b;">${reason}</p>
      </div>
      <p>During this suspension, your dashboard access and QR menu features will be temporarily disabled. Please contact support to resolve this issue.</p>
      <p>Best regards,<br/>The TableFlow Support Team</p>
    </div>
  `;
  return sendEmail(ownerEmail, "TableFlow — Account Suspended", html);
};

export const sendReactivationEmail = async (
  ownerEmail: string,
  ownerName: string,
  restaurantName: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #27ae60;">Account Reactivated</h2>
      <p>Hello ${ownerName},</p>
      <p>We are pleased to inform you that your TableFlow restaurant account for <strong>${restaurantName}</strong> has been reactivated.</p>
      <p>Your team can now log in to the portal and QR menu services are fully operational.</p>
      <p>Best regards,<br/>The TableFlow Support Team</p>
    </div>
  `;
  return sendEmail(ownerEmail, "TableFlow — Account Reactivated", html);
};

export const sendStaffWelcomeEmail = async (
  staffEmail: string,
  staffName: string,
  restaurantName: string,
  tempPassword: string
): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Welcome to TableFlow, ${staffName}!</h2>
      <p>Your staff account for <strong>${restaurantName}</strong> has been successfully created.</p>
      <p>You can access the portal and log in using the credentials below:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2980b9;">
        <p style="margin: 5px 0;"><strong>Username / Email:</strong> ${staffEmail}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="font-size: 1.2em; color: #e74c3c;">${tempPassword}</code></p>
      </div>
      <p style="color: #7f8c8d;"><em>Important: You will be required to change this temporary password immediately upon your first login.</em></p>
      <p>Best regards,<br/>The TableFlow Team</p>
    </div>
  `;
  return sendEmail(staffEmail, "TableFlow — Your Staff Account", html);
};
