// src/lib/email.ts
// Mock email service - Para desenvolvimento sem SendGrid

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
    
    // Em desenvolvimento, apenas loga no console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK EMAIL] Password Reset Email');
      console.log('To:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Token:', token);
      console.log('---');
      return;
    }
  
    // Em produção, você configurará SendGrid aqui
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail({...});
  }
  
  export async function sendMagicLinkEmail(email: string, token: string) {
    const magicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/magic-link-verify?token=${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK EMAIL] Magic Link');
      console.log('To:', email);
      console.log('Magic URL:', magicUrl);
      console.log('Token:', token);
      console.log('---');
      return;
    }
  }
  
  export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK EMAIL] Email Verification');
      console.log('To:', email);
      console.log('Verify URL:', verifyUrl);
      console.log('Token:', token);
      console.log('---');
      return;
    }
  }
  
  export async function sendWelcomeEmail(email: string, name: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK EMAIL] Welcome Email');
      console.log('To:', email);
      console.log('Name:', name);
      console.log('---');
      return;
    }
  }