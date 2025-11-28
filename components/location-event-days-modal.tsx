"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getEventByDate, Event as ApiEvent } from "@/service/eventApi"

interface EventDay {
  date: string
  startTime: string
  endTime: string
}

interface LocationEventDaysModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: any[]
  selectedLocationId: number
  eventDays: EventDay[]
  onSave: (locationId: number, days: EventDay[]) => void
}

export function LocationEventDaysModal({
  open,
  onOpenChange,
  locations,
  selectedLocationId,
  eventDays,
  onSave,
}: LocationEventDaysModalProps) {
  const [locationId, setLocationId] = useState<number>(selectedLocationId || 0)
  const [days, setDays] = useState<EventDay[]>([])
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showTimeSelection, setShowTimeSelection] = useState(false)
  const [selectedDateForTime, setSelectedDateForTime] = useState<string>("")
  const [editingDayIndex, setEditingDayIndex] = useState<number>(-1)
  const [existingEvents, setExistingEvents] = useState<ApiEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    if (open) {
      console.log('Modal opened - locations:', locations.length, 'selectedLocationId:', selectedLocationId)
      setLocationId(selectedLocationId || 0)
      setDays([]) // Always start with empty array
      setShowTimeSelection(false)
      setEditingDayIndex(-1)
      setSelectedDateForTime("")
    }
  }, [open, selectedLocationId, locations])

  // Auto-fetch events when location changes and we have a selected date
  useEffect(() => {
    if (locationId > 0 && selectedDateForTime) {
      console.log('🔄 Location or date changed, fetching events...', { locationId, selectedDateForTime })
      fetchExistingEvents(selectedDateForTime, locationId)
    }
  }, [locationId, selectedDateForTime, locations])

  // Generate time slots (6:00 - 22:00, every 30 minutes)
  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Fetch existing events for selected date and location
  const fetchExistingEvents = async (date: string, locationId: number) => {
    if (!date || !locationId) {
      console.log('❌ Missing date or locationId:', { date, locationId })
      return
    }
    
    console.log('🚀 Starting fetchExistingEvents...', { date, locationId })
    
    try {
      setLoadingEvents(true)
      console.log('📡 Calling getEventByDate API...')
      const events = await getEventByDate(date)
      console.log('✅ API response received:', events)
      
      // Filter events by selected location
      const selectedLocation = locations.find(loc => loc.id === locationId)
      console.log('🏢 Selected location:', selectedLocation)
      
      // First filter by approved/ongoing/completed status
      const approvedEvents = events.filter(event => {
        const allowedStatuses = ['APPROVED', 'ONGOING', 'COMPLETED']
        return allowedStatuses.includes(event.status)
      })
      console.log(`📋 Filtered to ${approvedEvents.length} approved/ongoing/completed events from ${events.length} total`)
      
      // Then filter by location
      const eventsAtLocation = approvedEvents.filter(event => {
        console.log('🔍 Comparing event location:', event.locationName, 'with selected:', selectedLocation?.name)
        return event.locationName === selectedLocation?.name
      })
      
      setExistingEvents(eventsAtLocation)
      console.log(`✅ Found ${eventsAtLocation.length} existing events at ${selectedLocation?.name} on ${date}:`, eventsAtLocation)
    } catch (error) {
      console.error('Error fetching existing events:', error)
      setExistingEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dateStr = formatDate(year, month, day)
    
    // Check if date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(year, month, day)
    if (selectedDate < today) return

    console.log('📅 Date selected:', dateStr, 'with locationId:', locationId)
    setSelectedDateForTime(dateStr)
    setShowTimeSelection(true)
    
    // Fetch existing events for this date and location
    if (locationId > 0) {
      console.log('🔥 Calling fetchExistingEvents from handleDateClick')
      fetchExistingEvents(dateStr, locationId)
    } else {
      console.log('⚠️ No locationId, skipping API call')
    }
  }

  const handleTimeSlotClick = (time: string, isStart: boolean) => {
    if (editingDayIndex >= 0) {
      // Editing existing day
      const newDays = [...days]
      if (isStart) {
        newDays[editingDayIndex].startTime = time
      } else {
        newDays[editingDayIndex].endTime = time
      }
      setDays(newDays)
      
      // If both times are set, close time selection
      if (newDays[editingDayIndex].startTime && newDays[editingDayIndex].endTime) {
        setShowTimeSelection(false)
        setEditingDayIndex(-1)
      }
    } else if (selectedDateForTime) {
      // Adding new day
      const existingDay = days.find(d => d.date === selectedDateForTime)
      if (existingDay) {
        // Update existing day
        const newDays = days.map(d => 
          d.date === selectedDateForTime 
            ? { ...d, [isStart ? 'startTime' : 'endTime']: time }
            : d
        )
        setDays(newDays)
        
        // Check if both times are set
        const updated = newDays.find(d => d.date === selectedDateForTime)
        if (updated && updated.startTime && updated.endTime) {
          setShowTimeSelection(false)
          setSelectedDateForTime("")
        }
      } else {
        // Create new day
        if (isStart) {
          setDays([...days, { date: selectedDateForTime, startTime: time, endTime: "" }])
        }
      }
    }
  }

  const handleAddDay = () => {
    // Find the last date and suggest next day
    if (days.length > 0) {
      const lastDate = new Date(days[days.length - 1].date)
      lastDate.setDate(lastDate.getDate() + 1)
      const nextDate = lastDate.toISOString().split('T')[0]
      setSelectedDateForTime(nextDate)
      setCurrentMonth(lastDate)
    }
    setShowTimeSelection(true)
  }

  const handleRemoveDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index))
  }

  const handleEditTime = (index: number) => {
    setEditingDayIndex(index)
    setSelectedDateForTime(days[index].date)
    setShowTimeSelection(true)
  }

  const handleSave = () => {
    if (!locationId || locationId === 0) {
      alert("Please select a location")
      return
    }
    if (days.length === 0) {
      alert("Please add at least one event day")
      return
    }
    
    // Validate all days have complete times
    const incompleteDays = days.filter(d => !d.startTime || !d.endTime)
    if (incompleteDays.length > 0) {
      alert("Please complete all time selections")
      return
    }

    onSave(locationId, days)
    onOpenChange(false)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const calendarDays = getDaysInMonth(currentMonth)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentDay = days.find(d => d.date === selectedDateForTime)
  const needsStartTime = currentDay && !currentDay.startTime
  const needsEndTime = currentDay && currentDay.startTime && !currentDay.endTime

  // Function to check if a time slot conflicts with existing events
  const isTimeSlotConflicted = (timeSlot: string) => {
    if (!selectedDateForTime || existingEvents.length === 0) return false
    
    const timeInMinutes = (time: string) => {
      const [hour, minute] = time.split(':').map(Number)
      return hour * 60 + minute
    }
    
    const slotMinutes = timeInMinutes(timeSlot)
    
    return existingEvents.some(event => {
      // Check if event has days array (multi-day event)
      if (event.days && event.days.length > 0) {
        const dayData = event.days.find(day => day.date === selectedDateForTime)
        if (dayData) {
          const startMinutes = timeInMinutes(dayData.startTime)
          const endMinutes = timeInMinutes(dayData.endTime)
          return slotMinutes >= startMinutes && slotMinutes < endMinutes
        }
      }
      return false
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Location & Event Days"
      description="Choose location and schedule your event days"
      className="sm:max-w-4xl max-h-[85vh] !fixed !top-[50%] !translate-y-[-50%] z-[80]"
    >
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 pr-4 max-h-[calc(85vh-200px)]" type="always">
          <div className="space-y-6">
          {/* Location Selection */}
          <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-semibold">Location *</Label>
            {locations.length === 0 && (
              <span className="text-xs text-muted-foreground">(Loading...)</span>
            )}
          </div>
          <Select
            value={locationId > 0 ? locationId.toString() : undefined}
            onValueChange={(value) => {
              console.log('Location selected:', value)
              setLocationId(Number(value))
            }}
            disabled={locations.length === 0}
          >
            <SelectTrigger className="h-11 text-base" disabled={locations.length === 0}>
              <SelectValue placeholder={locations.length === 0 ? "Loading locations..." : "Select location"} />
            </SelectTrigger>
            <SelectContent className="z-[90] max-h-[300px]" position="popper" sideOffset={5}>
              {locations.length === 0 ? (
                <SelectItem value="0" disabled>
                  No locations available
                </SelectItem>
              ) : (
                locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name} {loc.capacity ? `(Capacity: ${loc.capacity})` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Event Days Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">Event Days *</Label>
              {!locationId && (
                <span className="text-xs text-muted-foreground">(Select location first)</span>
              )}
            </div>
            {days.length > 0 && !showTimeSelection && locationId > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDay}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Day
              </Button>
            )}
          </div>

          {/* Selected Days List - Show first */}
          {days.length > 0 && !showTimeSelection && (
            <div className="space-y-3">
              {days.map((day, index) => (
                <div
                  key={index}
                  className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-lg">Day {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTime(index)}
                        className="h-8 px-2"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDay(index)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Date</div>
                      <div className="font-semibold">{day.date || 'Not selected'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Start Time</div>
                      <div className="font-semibold text-green-600">{day.startTime}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">End Time</div>
                      <div className="font-semibold text-red-600">{day.endTime}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calendar or Time Selection */}
          {!locationId ? (
            <div className="border-2 border-gray-300 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-gray-900/30 text-center">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Please select a location first to choose event days
              </p>
            </div>
          ) : showTimeSelection ? (
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg">
                  {editingDayIndex >= 0 ? "Edit Time" : "Choose Time Slots"}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTimeSelection(false)
                    setEditingDayIndex(-1)
                    setSelectedDateForTime("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">Selected Date</div>
                <div className="font-semibold text-lg">{selectedDateForTime}</div>
              </div>

              {needsStartTime && (
                <div className="mb-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  → Select Start Time
                </div>
              )}
              {needsEndTime && (
                <div className="mb-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  → Select End Time
                </div>
              )}

              <ScrollArea className="h-80">
                <div className="grid grid-cols-4 gap-2 pr-4">
                  {timeSlots.map((time) => {
                    const isSelected = currentDay?.startTime === time || currentDay?.endTime === time
                    const isConflicted = isTimeSlotConflicted(time)
                    
                    // Disable logic: if selecting end time, disable all times <= start time
                    let isDisabled = isConflicted // Always disable if conflicted
                    
                    if (needsEndTime && currentDay?.startTime) {
                      // Convert time strings to minutes for comparison
                      const [startHour, startMin] = currentDay.startTime.split(':').map(Number)
                      const [timeHour, timeMin] = time.split(':').map(Number)
                      const startMinutes = startHour * 60 + startMin
                      const timeMinutes = timeHour * 60 + timeMin
                      
                      // Disable if time is less than or equal to start time OR conflicted
                      isDisabled = isDisabled || (timeMinutes <= startMinutes)
                    }
                    
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSlotClick(time, needsStartTime || !currentDay)}
                        disabled={isDisabled}
                        className={cn(
                          "h-12 rounded-lg font-semibold text-base transition-all",
                          "border-2 hover:scale-105 active:scale-95",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-blue-400",
                          isConflicted && "bg-red-100 border-red-300 text-red-600 cursor-not-allowed dark:bg-red-950/30 dark:border-red-800",
                          isDisabled && !isConflicted && "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-900"
                        )}
                        title={isConflicted ? "This time slot is already occupied by another event" : undefined}
                      >
                        {time}
                        {isConflicted && (
                          <div className="text-xs mt-1 leading-none">Booked</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <>
              {/* Calendar View - Always show */}
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                {/* Calendar Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className="text-white hover:bg-white/20 h-9 w-9 p-0"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h3 className="text-white font-bold text-lg">{monthYear}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNextMonth}
                      className="text-white hover:bg-white/20 h-9 w-9 p-0"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 bg-blue-100 dark:bg-blue-900/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-bold text-blue-900 dark:text-blue-200"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 bg-white dark:bg-gray-950">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="h-14 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50" />
                      }

                      const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                      const isPast = dateObj < today
                      const isToday = dateObj.getTime() === today.getTime()
                      const isSelected = days.some(d => d.date === dateStr)

                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && handleDateClick(day)}
                          disabled={isPast}
                          className={cn(
                            "h-14 border border-gray-200 dark:border-gray-800 transition-all",
                            "hover:bg-blue-50 dark:hover:bg-blue-950/30",
                            isPast && "bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-50",
                            isToday && "ring-2 ring-blue-500 ring-inset",
                            isSelected && "bg-blue-600 text-white font-bold"
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
            </>
          )}
          </div>
          </div>
        </ScrollArea>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t bg-background shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!locationId || days.length === 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </Modal>
  )
}
