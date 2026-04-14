"use client";

import dynamic from "next/dynamic";

const FrontendCMSPage = dynamic(
  () => import("./frontend-cms-client"),
  { ssr: false }
);

export default function Page() {
  return <FrontendCMSPage />;
}
