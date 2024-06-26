"use client"

import React, { Children } from "react";
import { SessionProvider } from "next-auth/react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider> {children} </SessionProvider>;
};


