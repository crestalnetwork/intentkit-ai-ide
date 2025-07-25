import "../lib/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { PrivyProvider } from "@privy-io/react-auth";
import { privyConfig, queryClient, wagmiConfig } from "@/utils/config";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthProvider";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      config={privyConfig}
      appId={process.env.NEXT_PUBLIC_INTENTKIT_PRIVY_APPID!}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <AuthProvider>
            <Component {...pageProps} />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastClassName="!bg-[#161b22] !border !border-[#30363d] !text-[#c9d1d9]"
              progressClassName="!bg-[#58a6ff]"
            />
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default MyApp;
