import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useDisconnect } from "wagmi";

import { Chain, CHAIN_ID_TO_INFO, DEFAULT_CHAIN, NET } from "@/utils/chains";
import useWallet from "@/hooks/useWallet";
import {
  LinkedAccountWithMetadata,
  useCreateWallet,
  useLogin,
  usePrivy,
  User,
  useWallets,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { LoginMethod, PrivyErrorCode } from "@/types/auth";
import { getEip155ChainId, isSameAddress } from "@/utils/address";
import { delay } from "@/utils/common";
import { Address } from "viem";
import { useSwitchChain } from "@/hooks/useSwitchChain";
import { ClientEventEmitter } from "@/lib/utils/apiClient";

export enum AuthStatus {
  VOID = "",
  CONNECTING = "Connecting",
  AUTHENTICATING = "Authenticating",
  SIGNING = "Waiting for sign",
  SWITCHING_CHAIN = "Switching Network",
  LOGGING = "Logging in",
  LOGGING_OUT = "Logging out",
}

export interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  initingLogin: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  handleDisconnect: (reason?: string, cb?: () => void) => Promise<void>;
  isPageVisible: boolean;
  authStatus: AuthStatus;
  handleStartLogin: (params?: {
    redirectUrl?: string;
    skipDisconnect?: boolean;
  }) => void;
  walletLoading: boolean;
  setAuthStatus: (status: AuthStatus) => void;
  setCurrentChain: (chain: Chain) => void;
}

const defaultContext: AuthContextProps = {
  user: null,
  isAuthenticated: false,
  initingLogin: true,
  setAuthenticated: () => null,
  handleDisconnect: () => Promise.resolve(),
  isPageVisible: true,
  authStatus: AuthStatus.VOID,
  handleStartLogin: () => null,
  walletLoading: false,
  setAuthStatus: () => null,
  setCurrentChain: () => null,
};

export const AuthContext = createContext<AuthContextProps>(defaultContext);

export const AuthProvider: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const startLoginRef = useRef(false);
  const privyAuthenticatedRef = useRef(false);
  const redirectRef = useRef<string | undefined>(undefined);
  const lastLoginMethodRef = useRef<LoginMethod | null>(null);
  const isAuthenticatedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const { switchChain } = useSwitchChain();
  const {
    isConnected,
    displayAddress,
    targetChainId,
    chainId,
    targetChain,
    walletLoading,
    isUnsupported,
    status,
    connectWalletWithoutLogin,
    handleDisconnectAllSolanaWallets,
    handleDisconnectAllEvmWallets,
  } = useWallet();
  const displayAddressRef = useRef<Address | undefined>(displayAddress);
  const {
    ready,
    user: privyUser,
    authenticated,
    getAccessToken,
    logout: privyLogout,
  } = usePrivy();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentChain, setCurrentChain] = useState<Chain | undefined>(
    undefined
  );
  const [currentAddress, setCurrentAddress] = useState<Address | undefined>(
    undefined
  );
  const [showSolanaLogin, setShowSolanaLogin] = useState(false);

  // const { data: signature, signMessage, isPending: isSigningMessage, reset: resetSignMessage } = useSignMessage()
  // const { mutate: postLogin, isPending: isLogging } = usePostLogin()
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { setActiveWallet } = useSetActiveWallet();

  const appIsAuthenticated = useMemo(() => {
    if (currentAddress && authenticated) {
      return true;
    }
    return isAuthenticated && authenticated;
  }, [isAuthenticated, authenticated, currentAddress]);

  const { disconnect } = useDisconnect();

  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.VOID);

  const [pendingEmbedWalletSign, setPendingEmbedWalletSign] = useState<{
    walletAddress: Address;
    privyToken: string;
  } | null>(null);

  const pendingEmbedWalletSignRef = useRef<{
    walletAddress: Address;
    privyToken: string;
  } | null>(null);

  const signPendingRef = useRef(false);
  const registerPendingRef = useRef(false);

  const initingLogin = useMemo(() => {
    return !ready || walletLoading;
  }, [ready, walletLoading]);

  /**
   * isLoading
   */
  // const isLoading = useMemo(() => {
  //   return isSigningMessage || isLogging
  // }, [isSigningMessage, isLogging])

  useEffect(() => {
    const { privy_oauth_state } = router.query;

    if (privy_oauth_state) {
      setAuthStatus(AuthStatus.LOGGING);
    }
  }, [router.query]);

  useEffect(() => {
    privyAuthenticatedRef.current = authenticated;
    displayAddressRef.current = displayAddress;
    isAuthenticatedRef.current = isAuthenticated;
    isConnectedRef.current = isConnected;
    if (displayAddress) {
      setCurrentAddress(displayAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, displayAddress, isAuthenticated, isConnected]);

  /**
   * Router guard
   */
  useEffect(() => {
    // Check user token for authentication
    const checkTokenAndRedirect = async (url: string) => {
      if (
        // todo add protected paths
        [].some((prefix) => url.startsWith(prefix)) &&
        !authenticated
      ) {
        handleDisconnect("protected router matched");
        router.push("/");

        handleStartLogin({ redirectUrl: url });
      }
    };

    // Execute first when mounted
    checkTokenAndRedirect(router.pathname);

    // Listen to router change
    router.events.on("routeChangeStart", checkTokenAndRedirect);

    return () => {
      router.events.off("routeChangeStart", checkTokenAndRedirect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, isAuthenticated]);

  const [isPageVisible, setIsPageVisible] = useState(true);
  const isPageVisibleRef = useRef(true);

  // Checkout app login status when focused screen
  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    (async () => {
      const hasToken = await getAccessToken();
      setIsAuthenticated(!!hasToken);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageVisible, authenticated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
      isPageVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    ClientEventEmitter.on("DISCONNECT", () => {
      console.log("DISCONNECT EMITTED", privyAuthenticatedRef.current);
      handleDisconnect();
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      ClientEventEmitter.off("DISCONNECT", () => {
        handleDisconnect();
      });
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      return setAuthStatus(AuthStatus.VOID);
    }
  }, [status, isAuthenticated]);

  /**
   * Logout
   */
  const handleDisconnect = useCallback(
    async (reason?: string, callback?: () => void, silence = false) => {
      if (!silence) {
        setAuthStatus(AuthStatus.LOGGING_OUT);
      }

      // Ensure Privy logout completes fully before proceeding
      if (privyAuthenticatedRef.current) {
        try {
          await privyLogout();
          // Add a small delay to ensure Privy internal state is fully cleared
          await delay(100);
        } catch (error) {
          console.error("Privy logout error:", error);
        }
      }

      signPendingRef.current = false;
      registerPendingRef.current = false;
      // to handle the error case
      // reset some params & disconnect wallet
      // than we could use isAuthenticated to show connect wallet button or not now
      disconnect(undefined, {
        onSuccess() {
          handleDisconnectAllSolanaWallets();
          handleDisconnectAllEvmWallets();

          // clear all the localStorage which key is wagmi.store or wagmi.recentConnectorId
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("wagmi.")) {
              localStorage.removeItem(key);
            }
            if (key.startsWith("privy:")) {
              localStorage.removeItem(key);
            }
          });

          setCurrentChain({
            id: undefined,
          });
          setCurrentAddress(undefined);
          setIsAuthenticated(false);

          setTimeout(() => {
            console.debug(
              "Wallet disconnected triggered, reason: ",
              reason,
              " callback: ",
              callback
            );
            callback?.();
            if (!silence) {
              setAuthStatus(AuthStatus.VOID);
            }
          }, 100);
        },
      });
    },
    [
      disconnect,
      handleDisconnectAllEvmWallets,
      handleDisconnectAllSolanaWallets,
      privyLogout,
      // resetSignMessage,
      setCurrentAddress,
      setCurrentChain,
      setIsAuthenticated,
    ]
  );

  const onCrestalLoginSuccess = useCallback(async () => {
    // setSiweMessage('')
    // resetSignMessage()
    setIsAuthenticated(true);
    setAuthStatus(AuthStatus.VOID);
    if (displayAddressRef.current) {
      setCurrentAddress(displayAddressRef.current);
    }

    if (targetChainId ?? chainId) {
      setCurrentChain({
        id: targetChainId ?? chainId,
        net: CHAIN_ID_TO_INFO[targetChainId ?? chainId!]?.chain?.testnet
          ? NET.TEST
          : NET.MAIN,
      });
    }

    registerPendingRef.current = false;

    // const privyToken = await getAccessToken()
    // const accounts = getAccountsFromPrivyUser()

    // if (privyToken && accounts?.length) {
    //   updatePrivyAccount({
    //     user_address: displayAddress,
    //     accounts,
    //     privy_token: privyToken
    //   })
    // }

    const currentWallet =
      wallets.find((w) =>
        isSameAddress(w.address as Address, displayAddress)
      ) ?? wallets[0];

    if (
      isUnsupported ||
      !Object.keys(CHAIN_ID_TO_INFO)
        .map(Number)
        .includes(getEip155ChainId(currentWallet.chainId))
    ) {
      switchChain(targetChain?.id);
    }

    if (redirectRef.current) {
      router.push(redirectRef.current);
      redirectRef.current = undefined;
    }
  }, [
    chainId,
    displayAddress,
    isUnsupported,
    // resetSignMessage,
    router,
    setCurrentAddress,
    setCurrentChain,
    setIsAuthenticated,
    switchChain,
    targetChain?.id,
    targetChainId,
    wallets,
  ]);

  // const handleLoginWithPrivyToken = useCallback(
  //   async (address: Address, privyToken: string) => {
  //     postLogin(
  //       {
  //         payload: {
  //           is_privy: true,
  //           privy_token: privyToken,
  //           user_address: address
  //         }
  //       },
  //       {
  //         async onSuccess() {
  //           setCurrentAddress(address)
  //           onCrestalLoginSuccess()
  //         },
  //         onError(err) {
  //           console.log('postLogin error', err)
  //           handleDisconnect('post login failed')

  //           ErrorPopup.show({
  //             errorType: 'Login failed',
  //             message: err.message ?? 'Login request failed'
  //           })
  //         }
  //       }
  //     )
  //   },
  //   [handleDisconnect, onCrestalLoginSuccess, postLogin, setCurrentAddress]
  // )

  // const handleSignAndLogin = useCallback(
  //   async (address: Address) => {
  //     await setActiveWallet(wallets[0])

  //     try {
  //       setAuthStatus(AuthStatus.SIGNING)
  //       const nonceData = await getNonce(address)

  //       if (!nonceData) {
  //         toast.error('Get nonce failed')
  //         handleDisconnect('get nonce failed')
  //         return
  //       }

  //       const newSiweMessage = createSiweMessage({
  //         ...nonceData,
  //         chainId: base.id
  //       })
  //       console.log(newSiweMessage, 'newSiweMessage 1')
  //       setSiweMessage(newSiweMessage)

  //       signMessage(
  //         { message: newSiweMessage },
  //         {
  //           onSuccess(res) {
  //             // Automatically set signature
  //             console.log('signMessage success', res)
  //           },
  //           onError(err) {
  //             // console.log('signMessage error', err)
  //             // toast.warning(err.message)
  //             if (isAuthenticated) {
  //               return
  //             }

  //             handleDisconnect('sign message failed')

  //             ErrorPopup.show({
  //               errorType: 'Sign failed',
  //               message: err.message ?? 'Sign message failed'
  //             })
  //           }
  //         }
  //       )
  //     } catch (error) {
  //       handleDisconnect('get nonce error')
  //     }
  //   },
  //   [handleDisconnect, isAuthenticated, setActiveWallet, signMessage, wallets]
  // )

  useEffect(() => {
    (async () => {
      if (!pendingEmbedWalletSignRef.current || !wallets.length) {
        return;
      }

      if (!isConnected) {
        await setActiveWallet(wallets[0]);
        return;
      }

      if (wallets.length) {
        // checkWalletNewUserAndAuth({
        //   walletAddress: pendingEmbedWalletSignRef.current.walletAddress,
        //   privyToken: pendingEmbedWalletSignRef.current.privyToken
        // })
        onCrestalLoginSuccess();
        pendingEmbedWalletSignRef.current = null;
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, pendingEmbedWalletSign, isConnected]);

  // const checkIsNewUserRequest = useCallback(async (userAddress: Address, privyToken: string) => {
  //   const data = await checkIsNewUser({
  //     user_address: userAddress as Address,
  //     privy_token: privyToken
  //   })

  //   if (!data) {
  //     return true
  //   }

  //   if (data?.login_nonce && +data.login_nonce > 0) {
  //     return false
  //   }

  //   return true
  // }, [])

  // const checkWalletNewUserAndAuth = useCallback(
  //   async ({ walletAddress, privyToken }: { walletAddress: Address; privyToken: string }) => {
  //     try {
  //       wallets.length && (await setActiveWallet(wallets[0]))
  //       const isNewUser = await checkIsNewUserRequest(walletAddress, privyToken)
  //       if (isNewUser) {
  //         handleSignAndLogin(walletAddress)
  //       } else {
  //         handleLoginWithPrivyToken(walletAddress, privyToken)
  //       }
  //     } catch (error) {
  //       console.log(error, 'check embed wallet user and auth error')
  //       handleSignAndLogin(walletAddress)
  //     }
  //   },
  //   [checkIsNewUserRequest, handleLoginWithPrivyToken, handleSignAndLogin, setActiveWallet, wallets]
  // )

  const handleCreateEmbedWallet = useCallback(async () => {
    const newEmbedWallet = await createWallet();

    return newEmbedWallet;
  }, [createWallet]);

  const checkPrivyUserAndAuth = useCallback(
    async ({ user }: { user: User }) => {
      const privyToken = await getAccessToken();

      // if (!user.wallet?.address) {
      //   handleDisconnect('no wallet address')
      //   throw new Error('No wallet address')
      // }

      if (!privyToken) {
        handleDisconnect("no privy token");
        return;
      }

      // case web3 user login
      // call login api with privy token & address
      // if (method === 'siwe') {
      //   // handleLoginWithPrivyToken(user.wallet.address as Address, privyToken)
      //   checkWalletNewUserAndAuth({ walletAddress: user.wallet?.address as Address, privyToken })
      //   return
      // }

      // case web2 login with an external wallet
      // call login with privy token & address
      // if (user.wallet && user.wallet.walletClientType !== 'privy') {
      //   handleLoginWithPrivyToken(user.wallet.address as Address, privyToken)
      //   // TODO remind to connect wallet
      //   return
      // }

      // case web2 login with embed wallet
      // if (user.wallet && user.wallet.walletClientType === 'privy') {
      //   if (!wallets.length) {
      //     setPendingEmbedWalletSign({ walletAddress: user.wallet?.address as Address, privyToken })
      //     pendingEmbedWalletSignRef.current = { walletAddress: user.wallet?.address as Address, privyToken }
      //   } else {
      //     checkWalletNewUserAndAuth({ walletAddress: user.wallet?.address as Address, privyToken })
      //   }

      //   return
      // }

      if (!user.wallet) {
        try {
          const newEmbedWallet = await handleCreateEmbedWallet();

          if (!newEmbedWallet) {
            handleDisconnect("create embed wallet failed");
            toast.error("Create embed wallet failed");
            return;
          }

          setPendingEmbedWalletSign({
            walletAddress: newEmbedWallet.address as Address,
            privyToken,
          });
          pendingEmbedWalletSignRef.current = {
            walletAddress: newEmbedWallet.address as Address,
            privyToken,
          };
        } catch (error) {
          handleDisconnect("create embed wallet failed");
          toast.error("Create embed wallet failed");
        }
        return;
      }
    },
    [getAccessToken, handleDisconnect, handleCreateEmbedWallet]
  );

  const onLoginComplete = useCallback(
    async ({
      user,
      loginMethod,
    }: {
      user: User;
      isNewUser: boolean;
      wasAlreadyAuthenticated: boolean;
      loginMethod: LoginMethod | null;
      loginAccount: LinkedAccountWithMetadata | null;
    }) => {
      lastLoginMethodRef.current = loginMethod;
      // const privyToken = await getAccessToken()
      // let isNeedSignCase = false

      if (isAuthenticated) {
        return;
      }

      // try {
      //   isNeedSignCase =
      //     loginMethod !== 'siwe' && (await checkIsNewUserRequest(user.wallet!.address as Address, privyToken!))
      // } catch (error) {}

      if (isAuthenticated) {
        return;
      }
      if (!isPageVisibleRef.current || !startLoginRef.current) {
        return;
      }
      if (!isAuthenticated && !startLoginRef.current) {
        setAuthStatus(AuthStatus.LOGGING);
      }
      checkPrivyUserAndAuth({ user });
      onCrestalLoginSuccess();
    },
    [checkPrivyUserAndAuth, isAuthenticated, onCrestalLoginSuccess]
  );

  // useEffect(() => {
  //   if (registerPendingRef.current) {
  //     return
  //   }

  //   if (isAuthenticated || !signature || !chainId) return

  //   async function handleLogin() {
  //     if (address && siweMessage && signature && chainId) {
  //       try {
  //         setAuthStatus(AuthStatus.LOGGING)
  //         registerPendingRef.current = true
  //         signPendingRef.current = false

  //         const newSiweMessage = new SiweMessage(siweMessage)
  //         const verifySignature = await newSiweMessage.verify({ signature })

  //         if (verifySignature.success) {
  //           postLogin(
  //             {
  //               payload: {
  //                 user_address: address,
  //                 siwe_msg: siweMessage,
  //                 signature
  //               }
  //             },
  //             {
  //               async onSuccess(res) {
  //                 console.log('postLogin success', res)
  //                 setCurrentAddress(address)
  //                 onCrestalLoginSuccess()
  //               },
  //               onError(err) {
  //                 console.log('postLogin error', err)
  //                 handleDisconnect('post login failed')

  //                 ErrorPopup.show({
  //                   errorType: 'Login failed',
  //                   message: err.message ?? 'Login request failed'
  //                 })
  //               }
  //             }
  //           )
  //         } else {
  //           toast.warning('Signature verify failed')
  //           handleDisconnect('signature verify failed')
  //         }
  //       } catch (err) {
  //         handleDisconnect('post login error')
  //         console.log(err)
  //       }
  //     }
  //   }

  //   handleLogin()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   isConnected,
  //   isAuthenticated,
  //   siweMessage,
  //   signature,
  //   chainId,
  //   postLogin,
  //   setIsAuthenticated,
  //   handleDisconnect,
  //   setCurrentChain
  // ])

  const onLoginErrored = useCallback(
    (error: unknown) => {
      console.error("Login error: ", error);
      setAuthStatus(AuthStatus.VOID);
      if (error !== PrivyErrorCode.USER_EXITED_AUTH_FLOW) {
        handleDisconnect("login error");
      }
    },
    [handleDisconnect]
  );

  const { login } = useLogin({
    onComplete: onLoginComplete,
    onError: onLoginErrored,
  });

  const handleStartLogin = useCallback(
    async (
      {
        redirectUrl,
        skipDisconnect,
      }: { redirectUrl?: string; skipDisconnect?: boolean } = {
        redirectUrl: undefined,
        skipDisconnect: undefined,
      }
    ) => {
      startLoginRef.current = true;
      setAuthStatus(AuthStatus.LOGGING);

      if (!skipDisconnect) {
        await handleDisconnect("start login", undefined, true);
      }

      // 重新获取最新状态
      const latestAuthenticated = privyAuthenticatedRef.current;
      const latestPrivyUser = privyUser;
      const latestIsAuthenticated = isAuthenticatedRef.current;
      const latestIsConnected = isConnectedRef.current;

      if (latestIsAuthenticated && latestAuthenticated && !latestIsConnected) {
        connectWalletWithoutLogin(redirectUrl);
        return;
      }
      if (!latestIsAuthenticated && latestAuthenticated && latestPrivyUser) {
        checkPrivyUserAndAuth({ user: latestPrivyUser });
        // setIsAuthenticated(true)
        // onCrestalLoginSuccess()
      }
      redirectRef.current = redirectUrl;
      setShowSolanaLogin(false);
      login({
        walletChainType: "ethereum-only",
      });
    },
    [
      privyUser,
      setShowSolanaLogin,
      login,
      handleDisconnect,
      connectWalletWithoutLogin,
      checkPrivyUserAndAuth,
    ]
  );

  return (
    <AuthContext.Provider
      value={{
        ...defaultContext,
        initingLogin,
        handleStartLogin,
        handleDisconnect,
        authStatus,
        isPageVisible,
        user: privyUser,
        isAuthenticated: appIsAuthenticated,
        // isLoading,
        walletLoading,
        setAuthStatus,
        setCurrentChain,
      }}
    >
      {children}
      {/* for debug 
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'absolute', right: 0, top: 0, zIndex: 1000 }}>
          {JSON.stringify({
            walletLoading,
            isLoading,
            ready,
            isConnected,
            isAuthenticated,
            isUnsupported,
            authStatus,
            authenticated
          })}
        </div>
      )}
      */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
