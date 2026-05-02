import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // In development, log to console if SMTP not configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === "your-email@gmail.com") {
    console.log("📧 Email (dev mode - not sent):");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html.substring(0, 200)}...`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

// ──────────────────── EMAIL TEMPLATES ────────────────────

export function emailIndentSubmitted(reqNo: string, deptName: string) {
  return {
    subject: `Indent Submitted - ${reqNo}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h3>Indent Submitted Successfully</h3>
          <p>Your indent has been submitted to the Central Purchase Office.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">Requisition No:</td><td style="padding: 8px;">${reqNo}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Department:</td><td style="padding: 8px;">${deptName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px;">Submitted</td></tr>
          </table>
          <p>You will be notified once the CPO receives your indent.</p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailIndentReceived(reqNo: string, receiptNo: string, receiptDate: string) {
  return {
    subject: `Indent Received by CPO - ${reqNo}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h3>Indent Received by CPO</h3>
          <p>Your indent has been received and acknowledged by the Central Purchase Office.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">Requisition No:</td><td style="padding: 8px;">${reqNo}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Receipt No:</td><td style="padding: 8px;">${receiptNo}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Receipt Date:</td><td style="padding: 8px;">${receiptDate}</td></tr>
          </table>
          <p>Processing will begin shortly.</p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailNewIndentAlert(reqNo: string, deptName: string, itemCount: number) {
  return {
    subject: `New Indent Received - ${deptName}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h3>New Indent Alert</h3>
          <p>A new indent has been submitted.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">Requisition No:</td><td style="padding: 8px;">${reqNo}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Department:</td><td style="padding: 8px;">${deptName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Items:</td><td style="padding: 8px;">${itemCount}</td></tr>
          </table>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailUserActivated(userName: string) {
  return {
    subject: "Account Activated - AMU CPO Portal",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h3>Account Activated</h3>
          <p>Dear ${userName},</p>
          <p>Your account on the CPO Requirement Raise Form has been activated. You can now login and submit purchase indents.</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/login" style="background: #1B4332; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
          </p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailUserRegistered(userName: string) {
  return {
    subject: "Registration Successful - AMU CPO Portal",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h3>Registration Successful</h3>
          <p>Dear ${userName},</p>
          <p>Your registration on the CPO Procurement Portal was successful.</p>
          <p>Your account is currently pending approval from the administrator. You will receive another email once your account has been activated.</p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailOtpVerification(otp: string) {
  return {
    subject: "OTP Verification - AMU CPO Portal",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9; text-align: center;">
          <h3>Your Verification Code</h3>
          <p>Please use the following 6-digit code to verify your email address. This code is valid for 60 minutes.</p>
          <div style="margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1B4332; padding: 15px 30px; background: #E8F5E9; border-radius: 8px; border: 1px dashed #4CAF50;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #666;">If you did not request this code, please ignore this email.</p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}

export function emailPasswordResetOtp(otp: string) {
  return {
    subject: "Password Reset Code - AMU CPO Portal",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B4332; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">AMU Central Purchase Office</h2>
        </div>
        <div style="padding: 20px; background: #f9f9f9; text-align: center;">
          <h3>Password Reset Request</h3>
          <p>We received a request to reset the password for your account.</p>
          <p>Please use the following 6-digit code to reset your password. This code is valid for 15 minutes.</p>
          <div style="margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1B4332; padding: 15px 30px; background: #E8F5E9; border-radius: 8px; border: 1px dashed #4CAF50;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #666;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="background: #1B4332; color: #C9A84C; padding: 10px; text-align: center; font-size: 12px;">
          Aligarh Muslim University, Aligarh
        </div>
      </div>
    `,
  };
}
