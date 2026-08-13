'use client'

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), { ssr: false });

export function DynamicToaster() {
  return <Toaster theme="dark" position="bottom-center" duration={2000} swipeDirections={['right']} />
}
