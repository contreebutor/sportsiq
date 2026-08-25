export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080/v1",
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:8081",
};
