"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Video, 
  Mic, 
  Users, 
  Clock,
  MapPin,
  Zap,
  Plus,
  Filter
} from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  type: "ama" | "launch" | "education" | "community";
  host: {
    name: string;
    avatar: string;
    reputation: number;
  };
  description: string;
  startTime: string;
  duration: string;
  attendees: number;
  maxAttendees?: number;
  isLive: boolean;
  isUpcoming: boolean;
  tokenGated?: {
    symbol: string;
    required: number;
  };
}

const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Community Token Showcase",
    type: "community",
    host: { name: "@cryptoqueen", avatar: "👑", reputation: 5 },
    description: "Join us for the biggest token reveals and discussions of the week. Community voting on best projects.",
    startTime: "Live now",
    duration: "2 hours",
    attendees: 1247,
    maxAttendees: 2000,
    isLive: true,
    isUpcoming: false
  },
  {
    id: "2",
    title: "PEPE 2.0 Dev AMA",
    type: "ama",
    host: { name: "@froggod", avatar: "🐸", reputation: 5 },
    description: "Ask the dev team anything about upcoming features, partnerships, and roadmap updates.",
    startTime: "In 30 minutes",
    duration: "1 hour",
    attendees: 423,
    maxAttendees: 500,
    isLive: false,
    isUpcoming: true,
    tokenGated: {
      symbol: "$PEPE2",
      required: 10000
    }
  },
  {
    id: "3",
    title: "Smart Contract Security Workshop",
    type: "education",
    host: { name: "@securitydev", avatar: "🔒", reputation: 4 },
    description: "Learn how to audit smart contracts and identify common vulnerabilities. Hands-on exercises included.",
    startTime: "Tomorrow 2:00 PM UTC",
    duration: "3 hours",
    attendees: 156,
    maxAttendees: 300,
    isLive: false,
    isUpcoming: true
  },
  {
    id: "4",
    title: "$MOON Token Launch Event",
    type: "launch",
    host: { name: "@cryptokid", avatar: "🚀", reputation: 3 },
    description: "Join the official launch of $MOON token with live tokenomics reveal and community Q&A.",
    startTime: "Friday 6:00 PM UTC",
    duration: "1.5 hours",
    attendees: 89,
    maxAttendees: 1000,
    isLive: false,
    isUpcoming: true
  },
  {
    id: "5",
    title: "Weekly Community Roundup",
    type: "community",
    host: { name: "@communitymod", avatar: "🎯", reputation: 4 },
    description: "Weekly discussion of market trends, community highlights, and upcoming projects to watch.",
    startTime: "Sunday 4:00 PM UTC",
    duration: "1 hour",
    attendees: 234,
    isLive: false,
    isUpcoming: true
  }
];

const getEventIcon = (type: Event["type"]) => {
  switch (type) {
    case "ama": return <Mic className="h-4 w-4 text-blue-500" />;
    case "launch": return <Zap className="h-4 w-4 text-yellow-500" />;
    case "education": return <Calendar className="h-4 w-4 text-green-500" />;
    case "community": return <Users className="h-4 w-4 text-purple-500" />;
  }
};

const getEventTypeLabel = (type: Event["type"]) => {
  switch (type) {
    case "ama": return "AMA";
    case "launch": return "Launch";
    case "education": return "Workshop";
    case "community": return "Community";
  }
};

export default function EventsPage() {
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");

  const filteredEvents = MOCK_EVENTS.filter(event => {
    if (filter === "all") return true;
    if (filter === "live") return event.isLive;
    if (filter === "upcoming") return event.isUpcoming && !event.isLive;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Community Events</h1>
          <p className="text-xl text-foreground/70">
            Join live events, AMAs, launches, and educational workshops
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Host Event
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-red-500">3</div>
            <div className="text-sm text-foreground/60">Live Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-500">12</div>
            <div className="text-sm text-foreground/60">This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-500">2.4K</div>
            <div className="text-sm text-foreground/60">Active Attendees</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-foreground/60" />
        <Button
          variant={filter === "all" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Events
        </Button>
        <Button
          variant={filter === "live" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("live")}
          className="gap-2"
        >
          <Zap className="h-3 w-3" />
          Live Now
        </Button>
        <Button
          variant={filter === "upcoming" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("upcoming")}
          className="gap-2"
        >
          <Clock className="h-3 w-3" />
          Upcoming
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.map((event) => (
          <Card 
            key={event.id} 
            className={`transition-all hover:scale-[1.01] ${
              event.isLive ? "ring-2 ring-red-500/30 bg-red-500/5" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Event Icon */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {getEventIcon(event.type)}
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      {event.isLive && (
                        <Badge variant="primary" className="gap-1">
                          <Zap className="h-3 w-3 animate-pulse" />
                          Live
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-foreground/70 mb-4">{event.description}</p>

                  {/* Event Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.startTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatCompactNumber(event.attendees)}
                      {event.maxAttendees && ` / ${formatCompactNumber(event.maxAttendees)}`}
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{event.host.avatar}</span>
                    <div>
                      <span className="text-sm font-medium">Hosted by {event.host.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs">
                          {"⭐".repeat(event.host.reputation)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Token Gating */}
                  {event.tokenGated && (
                    <div className="mb-4 p-2 bg-surface/50 rounded-lg">
                      <div className="text-xs text-foreground/60 mb-1">Token-gated event:</div>
                      <div className="text-sm font-medium">
                        Requires {formatCompactNumber(event.tokenGated.required)} {event.tokenGated.symbol}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  <Button 
                    className="gap-2"
                    variant={event.isLive ? "primary" : "outline"}
                  >
                    {event.isLive ? (
                      <>
                        <Video className="h-4 w-4" />
                        Join Now
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        {event.tokenGated ? "RSVP" : "Register"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
        <h3 className="text-2xl font-bold mb-2">Want to host an event?</h3>
        <p className="text-foreground/60 mb-6">
          Create AMAs, launch parties, educational workshops, or community calls.
        </p>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Your Event
        </Button>
      </div>
    </div>
  );
}