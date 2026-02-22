<template>
  <aside v-if="selectedDay" class="w-96 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
    <div class="bg-slate-800 text-white p-5 border-b border-slate-700 flex justify-between items-center">
      <h2 class="text-lg font-semibold">{{ formattedSelectedDate }}</h2>
      <button @click="$emit('close')" class="text-slate-300 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="p-5 flex-1 overflow-y-auto flex flex-col gap-6">
      <!-- Daily P/L Summary -->
      <div v-if="selectedDaySummary" class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Daily P/L</h3>
        <div :class="['text-3xl font-bold', selectedDaySummary.pl >= 0 ? 'text-emerald-500' : 'text-red-500']">
          {{ selectedDaySummary.pl >= 0 ? '+' : '-' }}${{ Math.abs(selectedDaySummary.pl).toFixed(2) }}
        </div>
        <p class="text-sm text-slate-600">{{ selectedDaySummary.trades.length }} trades executed</p>
      </div>

      <!-- Journal Notes Section -->
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Journal Notes</h3>
        <div class="flex flex-col gap-3" v-if="dayComments.length > 0">
          <div v-for="c in dayComments" :key="c.id" class="bg-indigo-50 border border-indigo-100 text-slate-800 p-3 rounded-lg text-sm">
            {{ c.text }}
            <div class="text-xs text-indigo-400 mt-2 text-right">{{ new Date(c.timestamp).toLocaleTimeString() }}</div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400 italic">No notes for this day.</p>
        
        <form @submit.prevent="addComment" class="mt-2 flex flex-col gap-2">
          <textarea v-model="newComment" rows="3" placeholder="Add a journal note for today..." class="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-sm"></textarea>
          <button type="submit" :disabled="!newComment.trim()" class="self-end bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Save Note
          </button>
        </form>
      </div>

      <!-- Trade Details List -->
      <div class="flex flex-col gap-3" v-if="selectedDaySummary && selectedDaySummary.trades.length > 0">
         <div class="flex justify-between items-center border-b border-slate-100 pb-2">
             <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Trade Details</h3>
             <button @click="deleteTradesForDay" class="text-xs text-red-500 hover:text-red-700 transition-colors font-medium">Delete All Trades</button>
         </div>
         <div class="flex flex-col gap-2">
           <div v-for="(t, i) in paginatedTrades" :key="i" class="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
             <div class="flex flex-col">
               <div class="flex items-center gap-2">
                 <span class="text-sm font-medium text-slate-700">{{ t.Product || t.Symbol || 'Trade' }}</span>
                 <span v-if="t.qty" class="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{{ t.qty }} Cntr.</span>
               </div>
               <span class="text-xs text-slate-500">
                 {{ t.closeTimeStr || t['Sold Timestamp'] || t['Time'] || '' }} 
                 <span v-if="t.durationStr" class="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Held: {{ t.durationStr }}</span>
               </span>
             </div>
             <span :class="['text-sm font-semibold', parseFloat(t['P/L']) >= 0 ? 'text-emerald-500' : 'text-red-500']">
               {{ parseFloat(t['P/L']) >= 0 ? '+' : '' }}${{ parseFloat(t['P/L']).toFixed(2) }}
             </span>
           </div>
           
           <div v-if="totalPages > 1" class="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
             <button :disabled="currentPage === 1" @click="currentPage--" class="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded disabled:opacity-50 hover:bg-slate-200 transition-colors cursor-pointer">Prev</button>
             <span class="text-xs text-slate-500 font-medium">Page {{ currentPage }} of {{ totalPages }}</span>
             <button :disabled="currentPage === totalPages" @click="currentPage++" class="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded disabled:opacity-50 hover:bg-slate-200 transition-colors cursor-pointer">Next</button>
           </div>
         </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { useJournalStore } from '../store'

const props = defineProps({
  selectedDay: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])
const store = useJournalStore()

const newComment = ref('')
const currentPage = ref(1)
const tradesPerPage = 10

const formattedSelectedDate = computed(() => {
  if (!props.selectedDay) return ''
  try {
    return format(parseISO(props.selectedDay), 'EEEE, MMMM do, yyyy')
  } catch {
    return props.selectedDay
  }
})

const selectedDaySummary = computed(() => {
  if (!props.selectedDay) return null
  const tradesForDay = store.trades.filter(t => {
    const d = t['Trade Date'] || ''
    return d.startsWith(props.selectedDay) || d === props.selectedDay
  })
  if (tradesForDay.length === 0) return null
  const totalPL = tradesForDay.reduce((acc, t) => acc + parseFloat(t['P/L'] || 0), 0)
  return { date: props.selectedDay, pl: totalPL, trades: tradesForDay }
})

const dayComments = computed(() => {
  if (!props.selectedDay) return []
  return store.comments[props.selectedDay] || []
})

watch(() => props.selectedDay, () => {
  currentPage.value = 1
  newComment.value = ''
})

const paginatedTrades = computed(() => {
  if (!selectedDaySummary.value) return []
  const start = (currentPage.value - 1) * tradesPerPage
  const end = start + tradesPerPage
  return selectedDaySummary.value.trades.slice(start, end)
})

const totalPages = computed(() => {
  if (!selectedDaySummary.value) return 1
  return Math.ceil(selectedDaySummary.value.trades.length / tradesPerPage)
})

const addComment = async () => {
  if (!newComment.value.trim() || !props.selectedDay) return
  await store.addCommentToTrade(props.selectedDay, newComment.value.trim())
  newComment.value = ''
}

const deleteTradesForDay = async () => {
  if (confirm('Are you sure you want to delete all trades for this day?')) {
    await store.removeTradesForDay(props.selectedDay)
    emit('close')
  }
}
</script>
