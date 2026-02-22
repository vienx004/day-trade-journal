<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] overflow-hidden animate-in zoom-in-95 duration-200">
      <div class="p-5 border-b border-slate-100 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-slate-800">Add Manual Entry</h2>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="saveManualEntry" class="p-6 flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-slate-700">Date</label>
          <input type="date" v-model="manualForm.date" required class="p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-slate-700">Title (Ticker or Event)</label>
          <input type="text" v-model="manualForm.title" required placeholder="e.g. FOMC Meeting or TSLA Trade" class="p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-slate-700">Notes / Reflection</label>
          <textarea v-model="manualForm.notes" rows="4" placeholder="How did the trading go?" class="p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-sm"></textarea>
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Save Entry</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { format } from 'date-fns'
import { useJournalStore } from '../store'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])
const store = useJournalStore()

const manualForm = ref({ date: format(new Date(), 'yyyy-MM-dd'), title: '', notes: '' })

watch(() => props.show, (newVal) => {
  if (newVal) {
    manualForm.value = { date: format(new Date(), 'yyyy-MM-dd'), title: '', notes: '' }
  }
})

const saveManualEntry = async () => {
  await store.addManualEntry({ ...manualForm.value })
  emit('close')
}
</script>
