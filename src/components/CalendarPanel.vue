<template>
  <div class="flex-1 bg-white flex flex-col rounded-xl shadow-md border border-slate-200 p-4 overflow-hidden relative">
    <FullCalendar :options="calendarOptions" class="h-full w-full custom-calendar" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useJournalStore } from '../store'
import { format } from 'date-fns'

const store = useJournalStore()
const emit = defineEmits(['date-select'])

const calendarOptions = computed(() => ({
  plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: store.calendarEvents,
  dateClick: (arg) => {
    emit('date-select', arg.dateStr)
  },
  eventClick: (arg) => {
    const dateStr = format(arg.event.start, 'yyyy-MM-dd')
    emit('date-select', dateStr)
  },
  height: '100%',
  contentHeight: '100%',
  dayMaxEvents: true,
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  }
}))
</script>

<style>
/* Custom FullCalendar Tailwind Overrides */
.custom-calendar .fc-theme-standard td, .custom-calendar .fc-theme-standard th {
  border-color: #e2e8f0;
}
.custom-calendar .fc-col-header-cell {
  background-color: #f8fafc;
  padding: 8px 0;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.custom-calendar .fc-daygrid-day-number {
  color: #334155;
  font-weight: 500;
  padding: 8px;
}
.custom-calendar .fc-button-primary {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
  font-weight: 500 !important;
  text-transform: capitalize !important;
  border-radius: 6px !important;
  transition: all 0.2s !important;
}
.custom-calendar .fc-button-primary:hover {
  background-color: #e2e8f0 !important;
  color: #0f172a !important;
}
.custom-calendar .fc-button-active {
  background-color: #e2e8f0 !important;
  color: #0f172a !important;
}
.custom-calendar .fc-toolbar-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
}
</style>
