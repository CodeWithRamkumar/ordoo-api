const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    await sgMail.send({
      to: email,
      from: 'noreply@ordoo.com', // Use any email
      subject: 'Your OTP Code - Ordoo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    console.log('OTP Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('OTP Email send failed:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  
  try {
    await sgMail.send({
      to: email,
      from: 'noreply@ordoo.com',
      subject: 'Password Reset - Ordoo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Ordoo account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    console.log('Reset Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Reset Email send failed:', error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};