<template>
  <div class="h-screen w-screen flex flex-col bg-slate-50 text-slate-800">
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Day Trader Journal
      </h1>
      
      <div class="flex items-center gap-4">
        <span v-if="store.isLoading" class="text-sm text-slate-500 font-medium animate-pulse">Parsing...</span>
        <label class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all font-medium text-sm flex items-center justify-center">
          Import Tradovate CSV
          <input type="file" class="hidden" accept=".csv" @change="handleFileUpload" />
        </label>
        <button class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg shadow-sm transition-all font-medium text-sm border border-slate-200" @click="showManualEntryModal = true">
          Add Manual Entry
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-hidden p-6 flex gap-6">
      <CalendarPanel @date-select="handleDateSelect" />
      <SidebarPanel :selected-day="selectedDay" @close="selectedDay = null" />
    </main>

    <ManualEntryModal :show="showManualEntryModal" @close="showManualEntryModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useJournalStore } from './store'
import CalendarPanel from './components/CalendarPanel.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import ManualEntryModal from './components/ManualEntryModal.vue'

const store = useJournalStore()
const selectedDay = ref(null) // string date 'YYYY-MM-DD'
const showManualEntryModal = ref(false)

onMounted(async () => {
  await store.loadState()
})

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  try {
    await store.importCSV(file)
    event.target.value = null // reset
  } catch (e) {
    alert('Failed to parse CSV')
  }
}

const handleDateSelect = (dateStr) => {
  selectedDay.value = dateStr
}
</script>
