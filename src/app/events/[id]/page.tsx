import type { Metadata } from "next";
import Link from "next/link";
import { formatEventTime } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLocalEventById } from "@/lib/data/community";
import { getMessagesForEventGroup } from "@/lib/data/messages";
import { getAttendeeProfiles } from "@/lib/data/profiles";
import { RsvpButton, EventChat } from "./EventDetailClient";
import { MobileHeader } from "@/components/MobileHeader";
import { MapPinIcon } from "@/components/Icons";
import styles from "./event-detail.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getLocalEventById(id);
  if (!event) return { title: "Hangout not found" };
  return {
    title: event.title,
    description: `${event.eventDate} at ${formatEventTime(event.eventTime)} in ${event.locationName}. ${event.description.slice(0, 120)}`,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const event = await getLocalEventById(id);

  if (!event) notFound();

  const isAttending = session ? event.rsvps.includes(session.authUserId) : false;

  // Chat is only visible to RSVP'd members (enforced by RLS); a
  // non-attendee simply gets an empty thread rather than an error.
  const messages = isAttending ? await getMessagesForEventGroup(id) : [];

  const attendees = await getAttendeeProfiles(event.rsvps);

  return (
    <>
      <MobileHeader title={event.title} backHref="/events" />
      <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className="panel panel-padded flex flex-col gap-4">
            <div className={styles.header}>
              <span className="badge badge-info">
                {event.eventDate} @ {formatEventTime(event.eventTime)}
              </span>
              <h1>{event.title}</h1>
              <p className="text-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPinIcon size={14} /> {event.locationName}
              </p>
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
                  <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size="md" />
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
    </>
  );
}
