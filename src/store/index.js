import { defineStore } from 'pinia';
import { get, set } from 'idb-keyval';
import Papa from 'papaparse';

export const useJournalStore = defineStore('journal', {
    state: () => ({
        trades: [], // Trade entries parsed from CSV
        manualEntries: [], // Manual journal entries added
        comments: {}, // Comments tied to trade IDs
        isLoading: false,
    }),
    getters: {
        // Generate events for FullCalendar
        calendarEvents(state) {
            const events = [];

            // Group P/L per day for the calendar
            const dailyPL = {};
            state.trades.forEach(t => {
                if (!t['Trade Date']) return;
                const date = t['Trade Date']; // YYYY-MM-DD
                const pl = parseFloat(t['P/L'] || 0);
                if (!dailyPL[date]) {
                    dailyPL[date] = { date, pl: 0, trades: [] };
                }
                dailyPL[date].pl += pl;
                dailyPL[date].trades.push(t);
            });

            Object.values(dailyPL).forEach(day => {
                events.push({
                    id: `trade-${day.date}`,
                    title: `P/L: $${day.pl.toFixed(2)}`,
                    start: day.date,
                    allDay: true,
                    color: day.pl >= 0 ? '#10b981' : '#ef4444',
                    extendedProps: { type: 'daily-summary', data: day }
                });
            });

            // Manual entries
            state.manualEntries.forEach(entry => {
                events.push({
                    id: `manual-${entry.id}`,
                    title: entry.title,
                    start: entry.date,
                    allDay: true,
                    color: '#3b82f6',
                    extendedProps: { type: 'manual-entry', data: entry }
                });
            });

            return events;
        }
    },
    actions: {
        async loadState() {
            try {
                const stored = await get('journal-state');
                if (stored) {
                    this.trades = stored.trades || [];
                    this.manualEntries = stored.manualEntries || [];
                    this.comments = stored.comments || {};
                }
            } catch (e) {
                console.error('Failed to load state', e);
            }
        },
        async saveState() {
            try {
                await set('journal-state', {
                    trades: this.trades,
                    manualEntries: this.manualEntries,
                    comments: this.comments,
                });
            } catch (e) {
                console.error('Failed to save state', e);
            }
        },
        async importCSV(file) {
            this.isLoading = true;
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const pairsByProduct = {};

                        results.data.forEach(row => {
                            if (!row.Product || !row['Bought Timestamp'] || !row['Sold Timestamp']) return;
                            const product = row.Product;
                            if (!pairsByProduct[product]) {
                                pairsByProduct[product] = [];
                            }
                            const d1 = new Date(row['Bought Timestamp']).getTime();
                            const d2 = new Date(row['Sold Timestamp']).getTime();
                            const openTime = Math.min(d1, d2);
                            const closeTime = Math.max(d1, d2);

                            pairsByProduct[product].push({
                                ...row,
                                openTime,
                                closeTime,
                                pl: parseFloat(row['P/L'] || 0),
                                qty: parseInt(row['Paired Qty'] || 0, 10)
                            });
                        });

                        const groupedTrades = [];

                        Object.entries(pairsByProduct).forEach(([_, pairs]) => {
                            pairs.sort((a, b) => a.openTime - b.openTime);

                            let currentTrade = null;

                            pairs.forEach(pair => {
                                if (!currentTrade) {
                                    currentTrade = { ...pair, pairs: [pair] };
                                } else if (pair.openTime <= currentTrade.closeTime) { // overlapping timeline translates to single grouped deal
                                    currentTrade.closeTime = Math.max(currentTrade.closeTime, pair.closeTime);
                                    currentTrade.qty += pair.qty;
                                    currentTrade.pl += pair.pl;
                                    currentTrade.pairs.push(pair);
                                } else {
                                    groupedTrades.push(currentTrade);
                                    currentTrade = { ...pair, pairs: [pair] };
                                }
                            });

                            if (currentTrade) {
                                groupedTrades.push(currentTrade);
                            }
                        });

                        this.trades = groupedTrades.map(dt => {
                            const durationMs = dt.closeTime - dt.openTime;
                            const minutes = Math.floor(durationMs / 60000);
                            const seconds = Math.floor((durationMs % 60000) / 1000);
                            const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

                            return {
                                ...dt,
                                'Trade Date': dt['Trade Date'],
                                'P/L': dt.pl,
                                openTimeStr: new Date(dt.openTime).toLocaleString(),
                                closeTimeStr: new Date(dt.closeTime).toLocaleString(),
                                durationStr: durationStr,
                                Product: dt.Product
                            };
                        });

                        await this.saveState();
                        this.isLoading = false;
                        resolve();
                    },
                    error: (error) => {
                        this.isLoading = false;
                        reject(error);
                    }
                });
            });
        },
        async addManualEntry(entry) {
            entry.id = Date.now().toString();
            this.manualEntries.push(entry);
            await this.saveState();
        },
        async addCommentToTrade(date, comment) {
            if (!this.comments[date]) {
                this.comments[date] = [];
            }
            this.comments[date].push({ id: Date.now().toString(), text: comment, timestamp: new Date().toISOString() });
            await this.saveState();
        },
        async removeTradesForDay(date) {
            this.trades = this.trades.filter(t => {
                const d = t['Trade Date'] || '';
                return !(d.startsWith(date) || d === date);
            });
            await this.saveState();
        }
    }
});
