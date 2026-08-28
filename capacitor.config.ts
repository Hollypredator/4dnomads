import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell config for the iOS/Android store builds.
 *
 * WHY server.url RATHER THAN A BUNDLED BUILD: every route in this app is
 * server-rendered on demand (Server Components + Server Actions), so
 * `next build` produces no static export to bundle into the app. The shell
 * therefore loads the deployed site, which also means content and fixes ship
 * without a store review. The tradeoff is a hard network dependency -- there
 * is no offline mode, and the splash screen below is what the user sees while
 * the first request resolves.
 *
 * `webDir` still has to point somewhere real for the CLI's own checks even
 * though nothing is copied from it when server.url is set.
 */
const config: CapacitorConfig = {
  // Reverse-DNS of 4dnomads.com.tr, with the leading digit spelled out:
  // a Java package segment cannot start with a number, so "4dnomads" is
  // illegal as-is. PERMANENT once published -- the store listing URL and
  // every existing install are keyed to it, and it cannot be changed later.
  appId: "tr.com.fourdnomads.app",
  appName: "4dnomads",
  webDir: "public",

  server: {
    url: "https://4dnomads.com.tr",
    // The shell must not silently fall back to http if TLS fails -- that
    // would downgrade every request, including the auth cookie exchange.
    androidScheme: "https",
    cleartext: false,
    // Anything outside this list opens in the system browser instead of
    // inside the shell, so an outbound link (WhatsApp contact on an
    // emergency alert, Stripe checkout) never traps the user in the app.
    allowNavigation: ["4dnomads.com.tr", "*.4dnomads.com.tr", "*.supabase.co"],
  },

  plugins: {
    SplashScreen: {
      // Held until the web layer signals it has painted (see
      // src/components/NativeShell.tsx), rather than a fixed timeout that
      // either flashes early or stalls after the page is ready.
      launchAutoHide: false,
      backgroundColor: "#3355ffff",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#3355ff",
    },
    Keyboard: {
      // Resize the web view rather than the body so the fixed bottom tab bar
      // is pushed above the keyboard instead of being covered by it.
      resize: "native",
      resizeOnFullScreen: true,
    },
  },

  android: {
    // Keeps the shell on the release keystore's own WebView behaviour and
    // surfaces JS errors in logcat during development builds only.
    webContentsDebuggingEnabled: false,
  },
};

export default config;
