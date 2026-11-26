import { requireAdmin } from "@/lib/dal";
import { createSeason } from "@/app/seasons/actions";
import { SeasonForm } from "@/components/season-form";

export const metadata = { title: "New Season" };

export default async function NewSeasonPage() {
  await requireAdmin();
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">New Season</h1>
      <SeasonForm action={createSeason} />
    </div>
  );
}
