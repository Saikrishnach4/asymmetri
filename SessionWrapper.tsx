"use client"; // Required for using Context API in the App Router

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionWrapperProps {
  children: ReactNode;
  session?: any; // Use `any` if TypeScript complains, or import `Session` type from `next-auth`
}

export default function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
