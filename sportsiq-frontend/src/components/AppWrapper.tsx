import { ReactNode } from "react";
import { AuthProvider } from "../hooks/useAuth";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
