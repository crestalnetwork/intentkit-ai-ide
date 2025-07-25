import { OAuthProviderType } from "@privy-io/react-auth";
import { Address } from "viem";

export interface NonceParams {
  public_key: string;
}
export interface NonceResponse {
  nonce: string;
  user_address: Address | undefined;
}

export interface LoginParams {
  user_address: Address | undefined;
  signature?: string;
  siwe_msg?: string;
  privy_token?: string;
  is_privy?: boolean;
}

export interface LoginResponse {
  user_address: Address | undefined;
  access_token: string;
  refresh_token: string;
  access_token_expiration_after: number;
  refresh_token_expiration_after: number;
}

export enum AUTH_STATUS {
  LOADING = "loading",
  UNAUTH = "unauthenticated",
  AUTH = "authenticated",
}

export interface RefreshTokenParams {
  user_address: Address | undefined;
}
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  access_token_expiration_after: number;
  refresh_token_expiration_after: number;
}

export type LoginMethod =
  | "email"
  | "sms"
  | "siwe"
  | "siws"
  | "farcaster"
  | OAuthProviderType
  | "passkey"
  | "telegram"
  | "custom"
  | `privy:${string}`
  | "guest";

export type LinkedAccountType =
  | "wallet"
  | "solana"
  | "evm"
  | "smart_wallet"
  | "email"
  | "phone"
  | "google_oauth"
  | "twitter_oauth"
  | "discord_oauth"
  | "github_oauth"
  | "spotify_oauth"
  | "instagram_oauth"
  | "tiktok_oauth"
  | "linkedin_oauth"
  | "apple_oauth"
  | "custom_auth"
  | "farcaster"
  | "passkey"
  | "telegram"
  | "cross_app"
  | "guest"
  | "authorization_key";

export enum PrivyErrorCode {
  OAUTH_ACCOUNT_SUSPENDED = "oauth_account_suspended",
  MISSING_OR_INVALID_PRIVY_APP_ID = "missing_or_invalid_privy_app_id",
  MISSING_OR_INVALID_PRIVY_ACCOUNT_ID = "missing_or_invalid_privy_account_id",
  MISSING_OR_INVALID_TOKEN = "missing_or_invalid_token",
  INVALID_DATA = "invalid_data",
  INVALID_CAPTCHA = "invalid_captcha",
  LINKED_TO_ANOTHER_USER = "linked_to_another_user",
  CANNOT_LINK_MORE_OF_TYPE = "cannot_link_more_of_type",
  FAILED_TO_LINK_ACCOUNT = "failed_to_link_account",
  FAILED_TO_UPDATE_ACCOUNT = "failed_to_update_account",
  USER_EXITED_UPDATE_FLOW = "exited_update_flow",
  ALLOWLIST_REJECTED = "allowlist_rejected",
  OAUTH_USER_DENIED = "oauth_user_denied",
  OAUTH_UNEXPECTED = "oauth_unexpected",
  UNKNOWN_AUTH_ERROR = "unknown_auth_error",
  USER_EXITED_AUTH_FLOW = "exited_auth_flow",
  USER_EXITED_LINK_FLOW = "exited_link_flow",
  USER_EXITED_SET_PASSWORD_FLOW = "user_exited_set_password_flow",
  MUST_BE_AUTHENTICATED = "must_be_authenticated",
  UNKNOWN_CONNECT_WALLET_ERROR = "unknown_connect_wallet_error",
  GENERIC_CONNECT_WALLET_ERROR = "generic_connect_wallet_error",
  CLIENT_REQUEST_TIMEOUT = "client_request_timeout",
  INVALID_CREDENTIALS = "invalid_credentials",
  MISSING_MFA_CREDENTIALS = "missing_or_invalid_mfa",
  UNKNOWN_MFA_ERROR = "unknown_mfa_error",
  EMBEDDED_WALLET_ALREADY_EXISTS = "embedded_wallet_already_exists",
  EMBEDDED_WALLET_NOT_FOUND = "embedded_wallet_not_found",
  EMBEDDED_WALLET_CREATE_ERROR = "embedded_wallet_create_error",
  UNKNOWN_EMBEDDED_WALLET_ERROR = "unknown_embedded_wallet_error",
  EMBEDDED_WALLET_PASSWORD_UNCONFIRMED = "embedded_wallet_password_unconfirmed",
  EMBEDDED_WALLET_PASSWORD_ALREADY_EXISTS = "embedded_wallet_password_already_exists",
  EMBEDDED_WALLET_RECOVERY_ALREADY_EXISTS = "embedded_wallet_recovery_already_exists",
  TRANSACTION_FAILURE = "transaction_failure",
  UNSUPPORTED_CHAIN_ID = "unsupported_chain_id",
  NOT_SUPPORTED = "not_supported",
  CAPTCHA_TIMEOUT = "captcha_timeout",
  INVALID_MESSAGE = "invalid_message",
  UNABLE_TO_SIGN = "unable_to_sign",
  CAPTCHA_FAILURE = "captcha_failure",
  CAPTCHA_DISABLED = "captcha_disabled",
  SESSION_STORAGE_UNAVAILABLE = "session_storage_unavailable",
  TOO_MANY_REQUESTS = "too_many_requests",
  USER_LIMIT_REACHED = "max_accounts_reached",
  DISALLOWED_LOGIN_METHOD = "disallowed_login_method",
  DISALLOWED_PLUS_EMAIL = "disallowed_plus_email",
  PASSKEY_NOT_ALLOWED = "passkey_not_allowed",
  USER_DOES_NOT_EXIST = "user_does_not_exist",
  INSUFFICIENT_BALANCE = "insufficient_balance",
  ACCOUNT_TRANSFER_REQUIRED = "account_transfer_required",
}
