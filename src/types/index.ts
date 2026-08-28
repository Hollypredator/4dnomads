// ──────────────────────────────────────────────
// Nomads — Core TypeScript Types (Deepened)
// ──────────────────────────────────────────────

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";
export type HostingStatus = "accepting" | "maybe" | "not_accepting" | "wants_to_meet";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  languages: string[];
  interests: string[];
  isVerified: boolean;
  createdAt: string;
  isBanned?: boolean;
}

export interface Home {
  id: string;
  hostId: string;
  sleepingArrangement: string;
  maxGuests: number;
  houseRules: string;
  locationName: string;
  latitude: number;
  longitude: number;
  smokingPolicy: "Allowed" | "Outside only" | "Not allowed";
  petsInfo: string;
  amenities: string[];
  hostingStatus: HostingStatus;
  genderPreference: "Any" | "Males only" | "Females only";
  kidFriendly: boolean;
  wheelchairAccessible: boolean;
  blockoutDates: string[]; // YYYY-MM-DD strings
  /** Self-reported download speed in Mbps. null means the host didn't say. */
  wifiMbps: number | null;
}

export interface StayRequest {
  id: string;
  travelerId: string;
  hostId: string;
  homeId: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  status: RequestStatus;
  initialMessage: string;
  createdAt: string;
  inviteSent?: boolean; // True if host invited traveler from a public trip
}

export interface Message {
  id: string;
  stayRequestId?: string; // Optional if direct message/event chat
  eventGroupId?: string;  // For event group chats
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  stayRequestId: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
  isBlind: boolean; // True if other party hasn't reviewed yet (hidden on profile)
}

export interface PublicTrip {
  id: string;
  travelerId: string;
  destination: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  description: string;
  createdAt: string;
}

export interface LocalEvent {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  locationName: string;
  eventDate: string;
  eventTime: string;
  maxParticipants: number;
  rsvps: string[]; // User IDs
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  status: "pending" | "resolved";
  actionTaken?: string;
  createdAt: string;
}

export interface ForumTopic {
  id: string;
  city: string;
  category: "Hosting Q&A" | "Meetups & Coffee" | "Visa & Nomad Tips" | "Travel Buddies";
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  upvotes: number;
  upvotedBy: string[]; // User IDs
}

export interface ForumComment {
  id: string;
  topicId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface CommunityVouch {
  id: string;
  authorId: string;
  targetId: string;
  text: string;
  createdAt: string;
}

export interface EmergencyAlert {
  id: string;
  authorId: string;
  locationName: string;
  description: string;
  contactInfo: string;
  createdAt: string;
  isResolved: boolean;
}

// ──────────────────────────────────────────────
// Derived / UI Join Types
// ──────────────────────────────────────────────

export interface HostProfile extends User {
  home: Home | null;
  reviews: Review[];
  reviewCount: number;
  averageRating: number;
  responseRate: number;
  vouches?: CommunityVouch[];
}

export interface StayRequestWithUsers extends StayRequest {
  traveler: User;
  host: User;
}

export interface MessageThread {
  stayRequest?: StayRequest;
  eventGroup?: LocalEvent;
  otherUser?: User;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export interface PublicTripWithUser extends PublicTrip {
  traveler: User;
}

export interface LocalEventWithCreator extends LocalEvent {
  creator: User;
}

export interface UserReportWithUsers extends UserReport {
  reporter: User;
  target: User;
}

export interface ForumTopicWithAuthor extends ForumTopic {
  author: User;
  commentCount: number;
}

export interface EmergencyAlertWithAuthor extends EmergencyAlert {
  author: User;
}

export interface CommunityVouchWithAuthor extends CommunityVouch {
  author: User;
}

/** What getRecentVouches() returns: both sides resolved, for the feed. */
export interface CommunityVouchWithTarget extends CommunityVouchWithAuthor {
  target: User;
}
