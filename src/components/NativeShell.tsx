"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Wires the web layer to the Capacitor native shell. Renders nothing.
 *
 * Everything here is a no-op in a normal browser: the plugins are imported
 * dynamically and only after `Capacitor.isNativePlatform()` is true, so the
 * web bundle never pays for native code it cannot use, and a plugin that is
 * unavailable degrades to browser behaviour instead of throwing.
 */
export default function NativeShell({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  // Root tab destinations. On Android, pressing back from one of these should
  // background the app the way a native app does -- not walk backwards
  // through tab switches, and never fall off the history stack into a blank
  // web view.
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (isRootTab(window.location.pathname)) {
          App.exitApp();
        } else if (canGoBack) {
          router.back();
        } else {
          router.push("/");
        }
      });
      cleanup = () => void handle.remove();
    })();

    return () => cleanup?.();
  }, [router]);

  // Deep links. Currently only the Google OAuth return, which arrives on a
  // custom scheme after the system browser finishes consent -- the packaged
  // app cannot run that flow in its own web view (Google blocks it).
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        const { completeNativeGoogleSignIn } = await import("@/lib/native/oauth");
        const handled = await completeNativeGoogleSignIn(url);
        if (handled) {
          // refresh() re-runs the server components so they observe the
          // session cookie the exchange just wrote; replace() then leaves no
          // /login entry behind the dashboard in the history stack.
          router.refresh();
          router.replace("/dashboard");
        }
      });
      cleanup = () => void handle.remove();
    })();

    return () => cleanup?.();
  }, [router]);

  // Hide the splash only once the first screen has actually painted.
  // launchAutoHide is false in capacitor.config.ts precisely so this decides
  // the moment, instead of a timeout that guesses.
  useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
      ]);

      // The app renders on white with a blue accent, so the status bar needs
      // dark glyphs. Style.Light means "light background", not light text.
      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      requestAnimationFrame(() => void SplashScreen.hide());
    })();
  }, []);

  // Native apps do not keep a scroll position when you switch tabs to a
  // fresh screen; the browser's scroll restoration otherwise leaves a pushed
  // screen opening mid-page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Push registration. Only attempted for a signed-in user -- a token has to
  // belong to somebody, and prompting an anonymous visitor for notification
  // permission on first launch is the fastest way to get it denied for good.
  useEffect(() => {
    if (!signedIn) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      let status = await PushNotifications.checkPermissions();
      if (status.receive === "prompt") {
        status = await PushNotifications.requestPermissions();
      }
      if (status.receive !== "granted") return;

      const registration = await PushNotifications.addListener("registration", async (token) => {
        const { registerDeviceTokenAction } = await import("@/lib/actions/push");
        const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
        await registerDeviceTokenAction(token.value, platform);
      });

      const failure = await PushNotifications.addListener("registrationError", (err) => {
        console.error("[push] registration failed", err);
      });

      // Tapping a notification should land on the thread it is about, not
      // just open the app on whatever screen it was last showing.
      const tapped = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          const path = action.notification.data?.path;
          if (typeof path === "string" && path.startsWith("/")) router.push(path);
        }
      );

      await PushNotifications.register();

      cleanup = () => {
        void registration.remove();
        void failure.remove();
        void tapped.remove();
      };
    })();

    return () => cleanup?.();
  }, [signedIn, router]);

  return null;
}

const ROOT_TABS = ["/", "/explore", "/dashboard", "/messages"];
function isRootTab(path: string) {
  return ROOT_TABS.includes(path);
}
