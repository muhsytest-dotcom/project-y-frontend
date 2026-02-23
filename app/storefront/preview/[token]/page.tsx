"use client";

import { useParams } from "next/navigation";
import { StorefrontScreen } from "@/app/storefront/page";

export default function StorefrontPreviewPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";
  return <StorefrontScreen previewToken={token} />;
}
