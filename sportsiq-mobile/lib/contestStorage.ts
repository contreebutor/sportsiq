import * as SecureStore from "expo-secure-store";

const CONTEST_USER_PREFIX = "contest_user_";

const getEndOfDay = (): number => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  ).getTime();
};

export const storeContestUserID = async (
  pageID: string,
  contestUserID: string
): Promise<void> => {
  const key = `${CONTEST_USER_PREFIX}${pageID}`;
  const data = JSON.stringify({ contestUserID, expiry: getEndOfDay() });
  await SecureStore.setItemAsync(key, data);
};

export const getStoredContestUserID = async (
  pageID: string
): Promise<string | null> => {
  const key = `${CONTEST_USER_PREFIX}${pageID}`;
  const stored = await SecureStore.getItemAsync(key);
  if (!stored) return null;
  try {
    const data = JSON.parse(stored);
    if (Date.now() > data.expiry) {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
    return data.contestUserID;
  } catch {
    return null;
  }
};
