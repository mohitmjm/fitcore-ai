import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

// Define OTP data structure
interface OtpData {
  otp: string;
  expiresAt: number; // timestamp in ms
}

interface OtpStore {
  [email: string]: OtpData;
}

// Set up JSON-based OTP file path inside the .next directory to persist through hot-reloads
const STORE_DIR = path.join(process.cwd(), '.next');
const STORE_FILE = path.join(STORE_DIR, 'otps.json');

// Ensure store directory exists
function ensureStoreFile() {
  if (!fs.existsSync(STORE_DIR)) {
    try {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    } catch (e) {
      console.warn("Could not create .next directory for OTP storage", e);
    }
  }
  if (!fs.existsSync(STORE_FILE)) {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify({}), 'utf-8');
    } catch (e) {
      console.warn("Could not write initial OTP file", e);
    }
  }
}

// Read OTPs from file
function readOtps(): OtpStore {
  try {
    ensureStoreFile();
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(data || '{}');
    }
  } catch (e) {
    console.error("Failed to read OTP store", e);
  }
  return {};
}

// Write OTPs to file
function writeOtps(store: OtpStore) {
  try {
    ensureStoreFile();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to write OTP store", e);
  }
}

// Clean up expired OTPs to avoid storage growth
export function cleanExpiredOtps() {
  const store = readOtps();
  const now = Date.now();
  let modified = false;

  for (const email in store) {
    if (store[email].expiresAt < now) {
      delete store[email];
      modified = true;
    }
  }

  if (modified) {
    writeOtps(store);
  }
}

/**
 * Generates a 6-digit random numeric OTP, saves it in store, and sets a 5-minute expiry.
 */
export function generateOTP(email: string): string {
  cleanExpiredOtps();

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const store = readOtps();
  store[email.toLowerCase().trim()] = { otp, expiresAt };
  writeOtps(store);

  return otp;
}

/**
 * Verifies if the provided OTP matches the stored one for the email and is not expired.
 * Purges the OTP immediately on successful verification.
 */
export function verifyOTP(email: string, otp: string): boolean {
  cleanExpiredOtps();
  
  const formattedEmail = email.toLowerCase().trim();
  const store = readOtps();
  const entry = store[formattedEmail];

  if (!entry) return false;
  
  // Verify code and expiry
  if (entry.otp === otp && entry.expiresAt >= Date.now()) {
    // Delete OTP upon successful use (single use only)
    delete store[formattedEmail];
    writeOtps(store);
    return true;
  }

  return false;
}

/**
 * Sends a custom email with OTP to the user.
 * Supports Resend API (via fetch) and fallback to terminal console output.
 */
export async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your FitCore AI OTP Code</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0e14;
            color: #f3f4f6;
            margin: 0;
            padding: 0;
            text-align: center;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #121824;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .logo {
            display: inline-block;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.05em;
            color: #ffffff;
            text-decoration: none;
          }
          .logo span {
            color: #06b6d4;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 10px;
          }
          .description {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .code-box {
            background-color: rgba(6, 182, 212, 0.06);
            border: 1.5px dashed rgba(6, 182, 212, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            display: inline-block;
            letter-spacing: 0.15em;
            font-size: 32px;
            font-weight: 900;
            color: #06b6d4;
            font-family: "Courier New", Courier, monospace;
          }
          .footer {
            font-size: 11px;
            color: #6b7280;
            margin-top: 40px;
            line-height: 1.5;
          }
          .accent-glow {
            color: #a855f7;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="#" class="logo">FITCORE <span>AI</span></a>
          <h2 class="title">Verify Your Email</h2>
          <p class="description">
            Welcome to FitCore AI. Use the single-use verification code below to complete your sign-in process. This code will expire in 5 minutes.
          </p>
          
          <div class="code-box">${otp}</div>
          
          <p class="description" style="margin-top: 20px; font-size: 13px;">
            If you did not request this login code, you can safely ignore this email.
          </p>
          
          <div class="footer">
            Powered by the <span class="accent-glow">FitCore AI Engine</span>.<br>
            © ${new Date().getFullYear()} FitCore. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  // Log to terminal console in development/as fallback
  const logToConsole = () => {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│                   FITCORE CUSTOM AUTH                    │
│                                                          │
│  OTP FOR EMAIL:  ${email.padEnd(38)}  │
│  OTP CODE:       \x1b[36m\x1b[1m${otp}\x1b[0m\x1b[0m                                 │
│  EXPIRES IN:     5 Minutes                               │
│                                                          │
│  (Type this code in your browser login screen)           │
└──────────────────────────────────────────────────────────┘
`);
  };

  logToConsole();

  // If API key is available, send via Resend SDK
  if (apiKey && apiKey !== 'YOUR_RESEND_KEY') {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: 'FitCore AI <onboarding@resend.dev>',
        to: email,
        subject: `${otp} is your FitCore AI login code`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend SDK error:', error);
        return { success: false, error: error.message || 'Failed to send email via Resend SDK' };
      }

      console.log(`Email successfully dispatched via Resend SDK for user ${email}. ID: ${data?.id}`);
      return { success: true };
    } catch (e: any) {
      console.error('Failed to dispatch email via Resend SDK:', e);
      return { success: false, error: e.message || 'Network error sending email via Resend SDK' };
    }
  }

  // If no API key, but we are in dev mode, we succeed because the console logs it
  if (isDev) {
    console.warn(`Resend API Key is not configured. Falling back to local console OTP delivery.`);
    return { success: true };
  }

  return { success: false, error: 'Email service provider API Key not configured in .env.local' };
}

// -------------------------------------------------------------
// CREDENTIALS AUTH DATABASE
// -------------------------------------------------------------

export interface AppUser {
  email: string;
  username: string;
  password?: string;
  name: string;
  goal?: 'weight loss' | 'muscle gain' | 'endurance' | 'flexibility';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: 'home' | 'gym' | 'none';
  days_per_week?: number;
  diet_type?: 'veg' | 'non-veg' | 'vegan';
  diet_goal?: 'lose fat' | 'gain muscle' | 'maintain';
  allergies?: string[];
  meals_per_day?: number;
  weight_kg?: number;
  height_cm?: number;
  language?: 'english' | 'hinglish';
  is_subscribed?: boolean;
  wallet_balance?: number;
  referrals?: string[];
  whatsapp_enabled?: boolean;
  sms_enabled?: boolean;
  email_enabled?: boolean;
}

interface UserStore {
  [usernameOrEmail: string]: AppUser;
}

const USERS_FILE = path.join(STORE_DIR, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(STORE_DIR)) {
    try {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    } catch (e) {}
  }
  if (!fs.existsSync(USERS_FILE)) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
    } catch (e) {}
  }
}

export function readUsers(): UserStore {
  try {
    ensureUsersFile();
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data || '{}');
    }
  } catch (e) {
    console.error("Failed to read Users store", e);
  }
  return {};
}

export function writeUsers(store: UserStore) {
  try {
    ensureUsersFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to write Users store", e);
  }
}

export function isEmailRegistered(email: string): boolean {
  const users = readUsers();
  const lowerEmail = email.toLowerCase().trim();
  return Object.values(users).some(u => u.email.toLowerCase().trim() === lowerEmail);
}

export function isUsernameRegistered(username: string): boolean {
  const users = readUsers();
  const lowerUser = username.toLowerCase().trim();
  return users[lowerUser] !== undefined;
}

export function registerUser(email: string, username: string, password: string): AppUser {
  const users = readUsers();
  const lowerEmail = email.toLowerCase().trim();
  const lowerUsername = username.toLowerCase().trim();
  
  const newUser: AppUser = {
    email: lowerEmail,
    username: lowerUsername,
    password: password, // plaintext for local mock database
    name: username,
    is_subscribed: false,
    wallet_balance: 100,
    referrals: [],
    whatsapp_enabled: true,
    sms_enabled: false,
    email_enabled: true,
    goal: 'muscle gain',
    experience: 'intermediate',
    equipment: 'gym',
    days_per_week: 4,
    diet_type: 'non-veg',
    diet_goal: 'gain muscle',
    meals_per_day: 4,
    weight_kg: 72,
    height_cm: 178,
    language: 'english'
  };

  users[lowerUsername] = newUser;
  writeUsers(users);
  return newUser;
}

export function authenticateUser(loginId: string, password: string): AppUser | null {
  const users = readUsers();
  const cleanId = loginId.toLowerCase().trim();
  
  // Find by username first
  let user = users[cleanId];
  
  // If not found, find by email
  if (!user) {
    user = Object.values(users).find(u => u.email.toLowerCase().trim() === cleanId) as AppUser;
  }
  
  if (user && user.password === password) {
    // Return user profile without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  
  return null;
}
