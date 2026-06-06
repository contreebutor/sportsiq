import { supabase } from "../utils/supabase";

export const signUp = async (email: string, password: string) => {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
      }
    );

    if (signUpError) {
      return { error: signUpError };
    }

    return { id: signUpData?.user?.id || null };
  } catch (error) {
    console.error("Error signing up:", error);
    return { error: error as Error };
  }
};
