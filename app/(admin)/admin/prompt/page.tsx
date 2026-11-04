import { requireAdmin } from "@/lib/auth";
import { resolveActivePrompt } from "@/lib/ai";
import PromptEditorForm from "@/components/PromptEditorForm";
import { PageHeader } from "@/components/app/ui";

export default async function AdminPromptPage() {
  await requireAdmin();
  const active = await resolveActivePrompt();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Prompt template"
        description="The system prompt the AI uses to write every clinic's website copy. Changes apply to the next generation, no deploy needed. Bump the version so each site records which prompt wrote it."
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PromptEditorForm systemPrompt={active.systemPrompt} version={active.version} />
      </div>
    </div>
  );
}
