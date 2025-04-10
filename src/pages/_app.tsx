import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { NetworkStatus } from "@/components/ui/network-status";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <PermissionProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </PermissionProvider>
      <NetworkStatus />
    </AuthProvider>
  );
}