import { requireAdmin } from "@/lib/dal";
import { createEvent } from "@/app/seasons/actions";
import { EventForm } from "@/components/event-form";

export const metadata = { title: "New Event" };

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id: seasonId } = await params;

  async function handleCreate(formData: FormData) {
    "use server";
    return createEvent(seasonId, formData);
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">New Event</h1>
      <EventForm action={handleCreate} />
    </div>
  );
}
