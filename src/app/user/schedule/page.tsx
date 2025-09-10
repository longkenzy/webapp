"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import ScheduleCalendar from "@/components/schedule/ScheduleCalendar";

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color?: string;
  location?: string;
  isPublic: boolean;
  company?: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export default function UserSchedulePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/schedule");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    } finally {
      // Use setTimeout to avoid flushSync during render
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchEvents();
    }
  }, [session?.user?.id]);

  const handleEventCreate = async (eventData: any) => {
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [...prev, newEvent]);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const handleEventUpdate = async (eventId: string, eventData: any) => {
    try {
      const response = await fetch(`/api/schedule/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(prev => prev.map(event => 
          event.id === eventId ? updatedEvent : event
        ));
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/schedule/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view your schedule.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Team Schedule
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Organize, collaborate, and stay on top of your team's events and schedules with our intuitive calendar system
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white bg-opacity-5 rounded-full"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white bg-opacity-5 rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <ScheduleCalendar
              events={events}
              onEventCreate={handleEventCreate}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
              currentUserId={session.user.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


