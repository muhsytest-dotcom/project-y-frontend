import Link from "next/link";
import { Card } from "@/components/ui/Card";

type Props = {
  labels: {
    badge: string;
    heroTitle: string;
    heroDesc: string;
    home: string;
    dashboard: string;
  };
};

export function HeaderSection({ labels }: Props) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="badge badge-info">{labels.badge}</p>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">{labels.heroTitle}</h1>
          <p className="soft mt-2">{labels.heroDesc}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="button button-muted">{labels.home}</Link>
          <Link href="/dashboard" className="button button-muted">{labels.dashboard}</Link>
        </div>
      </div>
    </Card>
  );
}
