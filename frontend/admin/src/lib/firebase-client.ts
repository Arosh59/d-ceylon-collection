"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export function firebaseGoogleAuthentication() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: required("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        authDomain: required(
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        ),
        projectId: required(
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        ),
        appId: required("NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
      });
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return { auth: getAuth(app), provider };
}

export function hasFirebaseGoogleConfiguration(): boolean {
  return [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ].every((value) => Boolean(value?.trim()));
}

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`${name} is required to use Google sign-in.`);
  return value.trim();
}
