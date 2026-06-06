import { config } from "../config";
import { supabase } from "../utils/supabase";
const twilio = require("twilio");

const accountSid = config.twilio.accountSid.trim();
const authToken = config.twilio.authToken.trim();
const serviceSid = config.twilio.serviceSid.trim();
const client = twilio(accountSid, authToken);

export const createOTP = async (phone: string): Promise<boolean> => {
  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        channel: "sms",
        to: phone,
      });

    return verification.status === "pending";
  } catch (error: any) {
    console.error("Error creating verification:", error);
    return false;
  }
};

export const verifyOTP = async (
  phone: string,
  otp: string
): Promise<boolean> => {
  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        code: otp,
        to: phone,
      });
    const approved = verificationCheck.status === "approved";
    if (approved) {
      await supabase
        .from("m_users")
        .update({ last_otp_verified_at: new Date().toISOString() })
        .eq("phone", phone);
    }
    return approved;
  } catch (error) {
    console.error("Error creating verification check:", error);
    return false;
  }
};

export const needsOTP = async (phone: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("m_users")
      .select("last_otp_verified_at")
      .eq("phone", phone)
      .limit(1)
      .single();

    if (error || !data) return true;

    const lastVerified = data.last_otp_verified_at;
    if (!lastVerified) return true;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(lastVerified) < sevenDaysAgo;
  } catch {
    return true;
  }
};

export const sendSMS = async (
  phone: string,
  message: string
): Promise<boolean> => {
  try {
    await client.messages.create({
      body: message,
      from: config.twilio.from,
      to: phone,
    });
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};
