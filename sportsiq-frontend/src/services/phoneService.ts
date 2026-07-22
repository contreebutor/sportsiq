const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const createOTP = async (phone: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/phone/create-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error creating OTP:", error);
    return false;
  }
};

export const verifyOTP = async (
  phone: string,
  otp: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/phone/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return false;
  }
};
