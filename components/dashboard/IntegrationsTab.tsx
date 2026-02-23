import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type Props = {
  webhooks: Array<Record<string, unknown>>;
  asText: (value: unknown) => string;
  webhookDraft: { name: string; url: string; events: string };
  setWebhookDraft: (value: { name: string; url: string; events: string }) => void;
  webhookEdit: { id: string; name: string; url: string; events: string };
  setWebhookEdit: (value: { id: string; name: string; url: string; events: string }) => void;
  onCreateWebhook: () => Promise<void>;
  onUpdateWebhook: () => Promise<void>;
  onDeleteWebhook: (webhookId: string) => Promise<void>;
  onTestWebhook: (webhookId: string) => Promise<void>;
  labels: {
    createWebhook: string;
    editWebhook: string;
    selectWebhook: string;
    webhookName: string;
    webhookUrl: string;
    webhookEvents: string;
    create: string;
    update: string;
    webhooks: string;
    noWebhooks: string;
    createWebhookHelp: string;
    test: string;
    delete: string;
  };
};

export function IntegrationsTab({
  webhooks,
  asText,
  webhookDraft,
  setWebhookDraft,
  webhookEdit,
  setWebhookEdit,
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestWebhook,
  labels,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-lg font-bold">{labels.createWebhook}</h3>
        <div className="space-y-2">
          <input className="input" placeholder={labels.webhookName} value={webhookDraft.name} onChange={(e) => setWebhookDraft({ ...webhookDraft, name: e.target.value })} />
          <input className="input" placeholder={labels.webhookUrl} value={webhookDraft.url} onChange={(e) => setWebhookDraft({ ...webhookDraft, url: e.target.value })} />
          <input className="input" placeholder={labels.webhookEvents} value={webhookDraft.events} onChange={(e) => setWebhookDraft({ ...webhookDraft, events: e.target.value })} />
          <Button onClick={() => void onCreateWebhook()}>{labels.create}</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-bold">{labels.editWebhook}</h3>
        <div className="space-y-2">
          <select className="select" value={webhookEdit.id} onChange={(e) => {
            const found = webhooks.find((w) => asText(w.id) === e.target.value);
            setWebhookEdit({
              id: e.target.value,
              name: asText(found?.name),
              url: asText(found?.url),
              events: Array.isArray(found?.events) ? (found?.events as string[]).join(",") : asText(found?.events),
            });
          }}>
            <option value="">{labels.selectWebhook}</option>
            {webhooks.map((w) => <option key={asText(w.id)} value={asText(w.id)}>{asText(w.name) || asText(w.id)}</option>)}
          </select>
          <input className="input" placeholder={labels.webhookName} value={webhookEdit.name} onChange={(e) => setWebhookEdit({ ...webhookEdit, name: e.target.value })} />
          <input className="input" placeholder={labels.webhookUrl} value={webhookEdit.url} onChange={(e) => setWebhookEdit({ ...webhookEdit, url: e.target.value })} />
          <input className="input" placeholder={labels.webhookEvents} value={webhookEdit.events} onChange={(e) => setWebhookEdit({ ...webhookEdit, events: e.target.value })} />
          <Button variant="muted" onClick={() => void onUpdateWebhook()}>{labels.update}</Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-lg font-bold">{labels.webhooks}</h3>
        {webhooks.length === 0 ? (
          <EmptyState title={labels.noWebhooks} description={labels.createWebhookHelp} />
        ) : (
          <ul className="space-y-2 text-sm">
            {webhooks.map((w) => (
              <li key={asText(w.id)} className="rounded-xl border border-[#d9ddcf] bg-white p-3">
                <p className="font-semibold">{asText(w.name)}</p>
                <p className="soft code">{asText(w.url)}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="muted" onClick={() => void onTestWebhook(asText(w.id))}>{labels.test}</Button>
                  <Button variant="danger" onClick={() => void onDeleteWebhook(asText(w.id))}>{labels.delete}</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
