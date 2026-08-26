import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLocalEventById } from "@/lib/data/community";
import { getMessagesForEventGroup } from "@/lib/data/messages";
import { createClient } from "@/utils/supabase/server";
import { mapProfileRow } from "@/lib/data/mappers";
import { RsvpButton, EventChat } from "./EventDetailClient";
import styles from "./event-detail.module.css";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const event = await getLocalEventById(id);

  if (!event) notFound();

  const isAttending = session ? event.rsvps.includes(session.authUserId) : false;

  // Chat is only visible to RSVP'd members (enforced by RLS); a
  // non-attendee simply gets an empty thread rather than an error.
  const messages = isAttending ? await getMessagesForEventGroup(id) : [];

  const supabase = await createClient();
  const attendeesResult = event.rsvps.length > 0 ? await supabase.from("profiles").select("*").in("id", event.rsvps) : { data: [] };
  const attendees = (attendeesResult.data ?? []).map(mapProfileRow);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className="panel panel-padded flex flex-col gap-4">
            <div className={styles.header}>
              <span className="badge badge-info">
                {event.eventDate} @ {event.eventTime}
              </span>
              <h1>{event.title}</h1>
              <p className="text-secondary">📍 {event.locationName}</p>
            </div>

            <p className={styles.desc}>{event.description}</p>

            <div className={styles.rsvpSection}>
              <div>
                <span className="font-semibold text-lg">
                  RSVP List ({event.rsvps.length} / {event.maxParticipants})
                </span>
                <p className="text-secondary text-sm">Join this hangout and chat with other attendees.</p>
              </div>
              <RsvpButton eventId={id} isAttending={isAttending} loggedIn={!!session} />
            </div>

            <hr className="divider" />

            <div className={styles.attendeesList}>
              {attendees.map((u) => (
                <Link href={`/profile/${u.id}`} key={u.id} className={styles.attendee}>
                  <div className="avatar avatar-md">
                    {u.firstName[0]}
                    {u.lastName[0]}
                  </div>
                  <span className="text-sm font-medium">{u.firstName}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className="panel flex flex-col" style={{ height: "100%", minHeight: 450 }}>
            <div className="panel-header">
              <h3>Hangout Chat</h3>
            </div>
            <EventChat eventId={id} initialMessages={messages} attendees={attendees} isAttending={isAttending} currentUserId={session?.authUserId ?? null} />
          </div>
        </aside>
      </div>
    </div>
  );
}
