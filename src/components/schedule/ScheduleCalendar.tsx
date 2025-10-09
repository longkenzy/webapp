"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { DateSelectArg, EventClickArg, EventChangeArg } from "@fullcalendar/core";
import { toast } from "react-hot-toast";
import { Calendar, Plus, Users, User, ChevronDown, Search } from "lucide-react";

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

interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  onEventCreate: (eventData: any) => Promise<void>;
  onEventUpdate: (eventId: string, eventData: any) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  currentUserId: string;
}

// Danh sách công ty khách hàng
const CUSTOMER_COMPANIES = [
  { id: "abc", name: "Công ty TNHH ABC", shortName: "ABC" },
  { id: "xyz", name: "Công ty Cổ phần XYZ", shortName: "XYZ" },
  { id: "def", name: "Công ty TNHH DEF Technology", shortName: "DEF" },
  { id: "ghi", name: "Công ty Cổ phần GHI Solutions", shortName: "GHI" },
  { id: "jkl", name: "Công ty TNHH JKL Group", shortName: "JKL" },
  { id: "mno", name: "Công ty Cổ phần MNO Systems", shortName: "MNO" },
  { id: "pqr", name: "Công ty TNHH PQR Industries", shortName: "PQR" },
  { id: "stu", name: "Công ty Cổ phần STU Corporation", shortName: "STU" },
  { id: "vwx", name: "Công ty TNHH VWX Limited", shortName: "VWX" },
  { id: "yza", name: "Công ty Cổ phần YZA Holdings", shortName: "YZA" },
  { id: "bcd", name: "Công ty TNHH BCD Enterprises", shortName: "BCD" },
  { id: "efg", name: "Công ty Cổ phần EFG Partners", shortName: "EFG" },
  { id: "hij", name: "Công ty TNHH HIJ Ventures", shortName: "HIJ" },
  { id: "klm", name: "Công ty Cổ phần KLM Global", shortName: "KLM" },
  { id: "nop", name: "Công ty TNHH NOP International", shortName: "NOP" },
];

export default function ScheduleCalendar({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  currentUserId
}: ScheduleCalendarProps) {
  const [view, setView] = useState("dayGridMonth");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateSelectArg | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Update calendar view when view state changes
  useEffect(() => {
    if (calendarRef.current) {
      // Use setTimeout to avoid flushSync during render
      setTimeout(() => {
        const calendar = calendarRef.current?.getApi();
        if (calendar) {
          calendar.changeView(view);
        }
      }, 0);
    }
  }, [view]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateRange(selectInfo);
    setShowCreateModal(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowEditModal(true);
    }
  };

  const handleEventChange = async (changeInfo: EventChangeArg) => {
    try {
      const eventId = changeInfo.event.id;
      
      // Check if user owns this event
      const event = events.find(e => e.id === eventId);
      if (!event || event.user.id !== currentUserId) {
        toast.error("Bạn không có quyền chỉnh sửa sự kiện này");
        changeInfo.revert();
        return;
      }
      
      const eventData = {
        startAt: changeInfo.event.start?.toISOString(),
        endAt: changeInfo.event.end?.toISOString(),
        allDay: changeInfo.event.allDay
      };
      await onEventUpdate(eventId, eventData);
      toast.success("Sự kiện đã được cập nhật thành công");
    } catch (error) {
      toast.error("Không thể cập nhật sự kiện");
      changeInfo.revert();
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await onEventCreate(eventData);
      setShowCreateModal(false);
      setSelectedDateRange(null);
      toast.success("Event created successfully");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: any) => {
    try {
      await onEventUpdate(eventId, eventData);
      setShowEditModal(false);
      setSelectedEvent(null);
      toast.success("Event updated successfully");
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await onEventDelete(eventId);
        setShowEditModal(false);
        setSelectedEvent(null);
        toast.success("Event deleted successfully");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  const formatEvents = (events: ScheduleEvent[]) => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startAt,
      end: event.endAt,
      allDay: event.allDay,
      color: event.color,
      extendedProps: {
        description: event.description,
        location: event.location,
        isPublic: event.isPublic,
        user: event.user
      }
    }));
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
              <p className="text-sm text-gray-600">Manage your team's schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-medium">Add Event</span>
            </button>
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setView("dayGridMonth")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  view === "dayGridMonth" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView("timeGridWeek")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  view === "timeGridWeek" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView("timeGridDay")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  view === "timeGridDay" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView("listWeek")}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  view === "listWeek" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-100">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={view}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: ""
            }}
            events={formatEvents(events)}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            editable={true}
            droppable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            height="auto"
            eventDisplay="block"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            }}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            }}
            eventContent={(eventInfo) => (
              <div 
                className="bg-white bg-opacity-95 shadow-sm border border-gray-200 rounded px-1 py-0.5 text-xs h-auto min-h-[20px] cursor-pointer group relative"
                title={`${eventInfo.event.title}${eventInfo.event.extendedProps.description ? '\n\n' + eventInfo.event.extendedProps.description : ''}${eventInfo.event.extendedProps.location ? '\n\n🏢 ' + eventInfo.event.extendedProps.location : ''}\n\n⏰ ${eventInfo.event.start ? new Date(eventInfo.event.start).toLocaleString('vi-VN') : ''} - ${eventInfo.event.end ? new Date(eventInfo.event.end).toLocaleString('vi-VN') : ''}\n\n👤 Tạo bởi: ${eventInfo.event.extendedProps.user?.name || eventInfo.event.extendedProps.user?.username || 'Unknown'}`}
              >
                <div className="flex items-center gap-1">
                  {eventInfo.event.extendedProps.isPublic ? (
                    <Users className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <User className="h-2.5 w-2.5 text-indigo-600 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-900 truncate text-xs leading-tight">
                    {eventInfo.event.title}
                  </span>
                </div>
                
                {eventInfo.event.extendedProps.location && (
                  <div className="text-gray-500 text-xs truncate">
                    🏢 {eventInfo.event.extendedProps.location}
                  </div>
                )}
                
                <div className="text-gray-500 text-xs">
                  {eventInfo.event.start && new Date(eventInfo.event.start).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-64">
                  <div className="font-semibold mb-1">{eventInfo.event.title}</div>
                  
                  {eventInfo.event.extendedProps.description && (
                    <div className="mb-2 text-gray-300">
                      {eventInfo.event.extendedProps.description}
                    </div>
                  )}
                  
                  {eventInfo.event.extendedProps.location && (
                    <div className="mb-1 text-blue-300">
                      🏢 {eventInfo.event.extendedProps.location}
                    </div>
                  )}
                  
                  <div className="mb-1 text-yellow-300">
                    ⏰ {eventInfo.event.start && new Date(eventInfo.event.start).toLocaleString('vi-VN')} - {eventInfo.event.end && new Date(eventInfo.event.end).toLocaleString('vi-VN')}
                  </div>
                  
                  <div className="text-gray-400">
                    👤 Tạo bởi: {eventInfo.event.extendedProps.user?.name || eventInfo.event.extendedProps.user?.username || 'Unknown'}
                  </div>
                  
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            dayHeaderFormat={{ weekday: 'short' }}
            dayHeaderClassNames="text-gray-700 font-semibold text-sm"
            dayCellClassNames="hover:bg-blue-50 transition-colors duration-200"
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              list: 'List'
            }}
            buttonIcons={{
              prev: 'chevron-left',
              next: 'chevron-right'
            }}
            customButtons={{
              prev: {
                text: '‹',
                click: () => {
                  const calendar = calendarRef.current;
                  if (calendar) {
                    calendar.getApi().prev();
                  }
                }
              },
              next: {
                text: '›',
                click: () => {
                  const calendar = calendarRef.current;
                  if (calendar) {
                    calendar.getApi().next();
                  }
                }
              },
              today: {
                text: 'Today',
                click: () => {
                  const calendar = calendarRef.current;
                  if (calendar) {
                    calendar.getApi().today();
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          selectedDateRange={selectedDateRange}
          currentUserId={currentUserId}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDateRange(null);
          }}
          onSubmit={handleCreateEvent}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          currentUserId={currentUserId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

// Company Select Component with Search
function CompanySelect({ 
  value, 
  onChange, 
  placeholder = "Chọn công ty khách hàng" 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<typeof CUSTOMER_COMPANIES[0] | null>(
    CUSTOMER_COMPANIES.find(company => company.id === value) || null
  );

  // Update selectedCompany when value changes
  useEffect(() => {
    const company = CUSTOMER_COMPANIES.find(company => company.id === value);
    setSelectedCompany(company || null);
  }, [value]);

  const filteredCompanies = CUSTOMER_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (company: typeof CUSTOMER_COMPANIES[0]) => {
    setSelectedCompany(company);
    onChange(company.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedCompany(null);
    onChange("");
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedCompany ? "text-gray-900" : "text-gray-500"}>
          {selectedCompany ? selectedCompany.shortName : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(company)}
                >
                  <div className="font-medium text-gray-900">{company.shortName}</div>
                  <div className="text-xs text-gray-500">{company.name}</div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Không tìm thấy công ty nào
              </div>
            )}
          </div>
          
          {selectedCompany && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Xóa lựa chọn
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Create Event Modal Component
function CreateEventModal({
  selectedDateRange,
  currentUserId,
  onClose,
  onSubmit
}: {
  selectedDateRange: DateSelectArg | null;
  currentUserId: string;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startAt: selectedDateRange?.start.toISOString().slice(0, 16) || "",
    endAt: selectedDateRange?.end.toISOString().slice(0, 16) || "",
    company: "",
    color: "#3b82f6"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Tiêu đề là bắt buộc");
      return;
    }

    const startDate = new Date(formData.startAt);
    const endDate = new Date(formData.endAt);
    const now = new Date();

    // Kiểm tra thời gian bắt đầu không được trong quá khứ
    if (startDate < now) {
      toast.error("Không thể tạo sự kiện cho thời gian trong quá khứ");
      return;
    }

    // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
    if (endDate <= startDate) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    const eventData = {
      ...formData,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString()
    };

    await onSubmit(eventData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tạo sự kiện mới</h3>
        </div>
        <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tiêu đề sự kiện"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Nhập nội dung sự kiện"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày giờ bắt đầu
              </label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày giờ kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Công ty khách hàng
            </label>
            <CompanySelect
              value={formData.company}
              onChange={(value) => setFormData({ ...formData, company: value })}
              placeholder="Chọn công ty khách hàng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Màu sắc sự kiện
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tạo sự kiện
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

// Edit Event Modal Component
function EditEventModal({
  event,
  currentUserId,
  onClose,
  onSubmit,
  onDelete
}: {
  event: ScheduleEvent;
  currentUserId: string;
  onClose: () => void;
  onSubmit: (eventId: string, eventData: any) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    startAt: new Date(event.startAt).toISOString().slice(0, 16),
    endAt: new Date(event.endAt).toISOString().slice(0, 16),
    allDay: event.allDay,
    color: event.color || "#3b82f6",
    location: event.location || "",
    isPublic: event.isPublic
  });

  const isOwner = event.user.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Tiêu đề là bắt buộc");
      return;
    }

    const startDate = new Date(formData.startAt);
    const endDate = new Date(formData.endAt);
    const now = new Date();

    // Kiểm tra thời gian bắt đầu không được trong quá khứ
    if (startDate < now) {
      toast.error("Không thể tạo sự kiện cho thời gian trong quá khứ");
      return;
    }

    // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
    if (endDate <= startDate) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    const eventData = {
      ...formData,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString()
    };

    await onSubmit(event.id, eventData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa sự kiện</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {event.isPublic ? (
                <Users className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>by {event.user.name || event.user.username}</span>
            </div>
          </div>
        </div>
        <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Nhập tiêu đề sự kiện"
              required
              disabled={!isOwner}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:text-gray-500"
              rows={3}
              placeholder="Nhập nội dung sự kiện"
              disabled={!isOwner}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày giờ bắt đầu
              </label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={!isOwner}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày giờ kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={!isOwner}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Công ty khách hàng
            </label>
            <CompanySelect
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              placeholder="Chọn công ty khách hàng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Màu sắc sự kiện
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isOwner}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            )}
            {isOwner && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Cập nhật
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
