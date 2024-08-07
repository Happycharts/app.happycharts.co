"use client"
import { useEffect } from 'react';
import ServiceBell from "@servicebell/widget";

export function ServiceBellInitializer() {
  useEffect(() => {
    ServiceBell("init", "b951bf1ae1c8405b8f7a47ae2a153512", {
      hidden: false,
      position: "right",
      connect: true,
      launcher: 'pill',
      blockClass: "sb-block",
      mode: "retrigger"
    });
  }, []);

  return null;
}