import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { updateEvent } from "@/app/seasons/actions";
import { EventForm } from "@/components/event-form";

export const metadata = { title: "Edit Event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateEvent(eventId, formData);
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Event: {event.name}</h1>
      <EventForm action={handleUpdate} defaultValues={event} />
    </div>
  );
}
