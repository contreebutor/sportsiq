import { fetchUser } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

export function useAuthUser() {
  const { phone, user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (phone === null) {
      router.replace("/enter-phone");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUser(phone);
      setUser(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [phone, setUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace("/(app)/create-profile");
    }
  }, [loading, user]);

  return { loading, user };
}
