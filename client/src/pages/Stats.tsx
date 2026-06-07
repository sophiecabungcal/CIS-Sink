import { useStats } from "@/hooks/use-stats";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Leaf, Trash2, TrendingUp, Package, Calendar, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type TimePeriod = 'week' | 'month' | '3months';

export default function Stats() {
  const { data: stats, isLoading } = useStats();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  const chartData = stats ? [
    { name: 'Consumed', value: stats.allTime.consumed, color: '#22c55e' },
    { name: 'Disposed', value: stats.allTime.disposed, color: '#ef4444' },
  ] : [];

  const resolvedTotal = stats ? stats.allTime.consumed + stats.allTime.disposed : 0;

  const getPeriodData = () => {
    if (!stats) return { added: 0, consumed: 0, disposed: 0, label: 'This Month' };
    switch (selectedPeriod) {
      case 'week':
        return { ...stats.lastWeek, label: 'Last 7 Days' };
      case 'month':
        return { ...stats.lastMonth, label: 'Last 30 Days' };
      case '3months':
        return { ...stats.last3Months, label: 'Last 90 Days' };
    }
  };

  const periodData = getPeriodData();
  const periodSaveRate = periodData.consumed + periodData.disposed > 0 
    ? Math.round((periodData.consumed / (periodData.consumed + periodData.disposed)) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#FBDB93] pb-24">
      <AppHeader title="Your Impact" subtitle="See how you're reducing food waste" />

      <main className="px-4 py-6 max-w-md mx-auto space-y-5">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* All-Time Summary Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[#641B2E]" />
                <h3 className="font-bold text-[#641B2E]">All-Time Summary</h3>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Pie Chart */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  {resolvedTotal > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                      <span className="text-xs text-gray-400">No data</span>
                    </div>
                  )}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-lg font-bold text-[#641B2E]" data-testid="text-resolved-total">{resolvedTotal}</div>
                    <div className="text-[10px] text-gray-500">resolved</div>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Leaf size={12} className="text-green-600" />
                      </div>
                      <span className="text-sm text-gray-600">Consumed</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600" data-testid="text-consumed-percent">{stats?.allTime.consumedPercent || 0}%</span>
                      <span className="text-xs text-gray-400 ml-1">({stats?.allTime.consumed || 0})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 size={12} className="text-red-600" />
                      </div>
                      <span className="text-sm text-gray-600">Disposed</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600" data-testid="text-disposed-percent">{stats?.allTime.disposedPercent || 0}%</span>
                      <span className="text-xs text-gray-400 ml-1">({stats?.allTime.disposed || 0})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Package size={12} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">Still Active</span>
                    </div>
                    <span className="font-bold text-blue-600" data-testid="text-active-items">{stats?.allTime.active || 0}</span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl flex gap-2">
                <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  <strong>Consumed</strong> = items you ate before expiring. <strong>Disposed</strong> = items thrown away. Higher consumed % means less food waste.
                </p>
              </div>
            </motion.div>

            {/* Time Period Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#641B2E]" />
                  <h3 className="font-bold text-[#641B2E]">Activity Timeline</h3>
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2 mb-4">
                {(['week', 'month', '3months'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-[#641B2E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid={`button-period-${period}`}
                  >
                    {period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>

              {/* Period Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700" data-testid="text-period-added">{periodData.added}</div>
                  <div className="text-xs text-blue-600 mt-1">Items Added</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-700" data-testid="text-period-consumed">{periodData.consumed}</div>
                  <div className="text-xs text-green-600 mt-1">Consumed</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-700" data-testid="text-period-disposed">{periodData.disposed}</div>
                  <div className="text-xs text-red-600 mt-1">Disposed</div>
                </div>
              </div>

              {/* Period Save Rate */}
              {periodData.consumed + periodData.disposed > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{periodData.label} save rate:</span>
                    <span className="text-lg font-bold text-green-600" data-testid="text-period-save-rate">{periodSaveRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${periodSaveRate}%` }}
                    />
                  </div>
                </div>
              )}

              {periodData.consumed + periodData.disposed === 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-500">No items resolved in this period yet.</p>
                </div>
              )}
            </motion.div>

            {/* Food Waste Saved Insight */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#641B2E] to-[#8B2A42] rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={18} />
                <h3 className="font-bold">Your Sustainability Impact</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Total items saved from waste:</span>
                  <span className="text-xl font-bold" data-testid="text-total-saved">{stats?.allTime.consumed || 0}</span>
                </div>
                
                {stats && stats.allTime.consumed > 0 && (
                  <p className="text-sm text-white/70">
                    By consuming {stats.allTime.consumed} items before they expired, you've made a positive impact on reducing food waste. 
                    {stats.allTime.consumedPercent >= 70 && " Keep up the great work!"}
                    {stats.allTime.consumedPercent < 50 && stats.allTime.consumedPercent > 0 && " Try to consume items before they expire to improve your impact."}
                  </p>
                )}

                {(!stats || stats.allTime.total === 0) && (
                  <p className="text-sm text-white/70">
                    Start tracking items in your pantry to see your sustainability impact here.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-bold text-[#641B2E] mb-3">Tips to Reduce Waste</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#BE5B50] font-bold">1.</span>
                  Check your pantry before shopping to avoid buying duplicates
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#BE5B50] font-bold">2.</span>
                  Use the recipe feature to find meals for items expiring soon
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#BE5B50] font-bold">3.</span>
                  Store items properly to extend their shelf life
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
