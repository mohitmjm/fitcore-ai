'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  LineChart as LineChartIcon, 
  Plus, 
  Camera, 
  Calendar, 
  Scale, 
  Ruler, 
  Image as ImageIcon,
  Activity,
  ChevronRight,
  TrendingDown,
  Upload
} from 'lucide-react';
import { localDb, ProgressLog, ProgressPhoto } from '@/lib/db';

export default function ProgressPage() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  
  // Metric Inputs
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [arms, setArms] = useState('');
  const [date, setDate] = useState('');
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState<'weight' | 'measurements'>('weight');

  useEffect(() => {
    // Set default date to today
    setDate(new Date().toISOString().split('T')[0]);
    loadData();
  }, []);

  const loadData = () => {
    setLogs(localDb.getProgressLogs());
    setPhotos(localDb.getProgressPhotos());
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    localDb.addProgressLog({
      weight_kg: Number(weight),
      chest_inches: chest ? Number(chest) : undefined,
      waist_inches: waist ? Number(waist) : undefined,
      arms_inches: arms ? Number(arms) : undefined,
      recorded_date: date
    });

    // Reset fields
    setWeight('');
    setChest('');
    setWaist('');
    setArms('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowLogModal(false);
    
    // Reload state
    loadData();
    window.dispatchEvent(new Event('fitcore_profile_updated')); // refresh navbar weight
  };

  // Convert uploaded image to base64 and save to db
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        localDb.addProgressPhoto(event.target.result);
        loadData();
      }
    };
    reader.readAsDataURL(file);
  };

  // Prep data for Recharts
  const chartData = logs.map(log => ({
    date: new Date(log.recorded_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: log.weight_kg,
    chest: log.chest_inches || 0,
    waist: log.waist_inches || 0,
    arms: log.arms_inches || 0
  }));

  // Determine weight changes
  const latestWeight = logs[logs.length - 1]?.weight_kg || 0;
  const initialWeight = logs[0]?.weight_kg || 0;
  const weightChange = latestWeight - initialWeight;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <LineChartIcon className="h-8 w-8 text-cyan-400" />
            Progress <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Tracker & Logs</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            Monitor your muscle development, bodyweight trends, and weekly visual transformations.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.02] text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <Plus className="h-4 w-4" />
          Log Today's Metrics
        </button>
      </div>

      {/* OVERVIEW STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Scale className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Current Weight</span>
            <p className="text-xl font-bold text-white mt-0.5">{latestWeight ? `${latestWeight} kg` : 'N/A'}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Progress</span>
            <p className={`text-xl font-bold mt-0.5 ${weightChange <= 0 ? 'text-emerald-400' : 'text-purple-400'}`}>
              {weightChange === 0 ? '0 kg' : weightChange > 0 ? `+${weightChange.toFixed(1)} kg` : `${weightChange.toFixed(1)} kg`}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Photos Tracked</span>
            <p className="text-xl font-bold text-white mt-0.5">{photos.length} photos</p>
          </div>
        </div>
      </div>

      {/* METRIC CHARTS PANEL */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Progression Analytics
          </h2>
          
          <div className="flex bg-[#0b0e14] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveMetricTab('weight')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'weight'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Weight Chart
            </button>
            <button
              onClick={() => setActiveMetricTab('measurements')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'measurements'
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Body Metrics
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
              Log metrics to begin plotting your fitness chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeMetricTab === 'weight' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131722', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#weightGrad)" />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131722', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="chest" name="Chest (in)" stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="waist" name="Waist (in)" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="arms" name="Arms (in)" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* PROGRESS PHOTO LOG PANEL */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-400" />
            Visual Progress Logs
          </h2>
          
          <label className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            Upload Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Gallery */}
        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            <Camera className="h-8 w-8 mx-auto text-gray-600 mb-2.5" />
            No progress photos uploaded yet. Track visual updates here.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[3/4] bg-[#0b0e14] border border-white/5 shadow-md">
                <img 
                  src={photo.photo_url} 
                  alt={`Progress ${new Date(photo.uploaded_at).toLocaleDateString()}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-3">
                  <span className="text-[10px] text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* METRIC LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden p-6 md:p-8 space-y-6 relative border border-white/10 animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div>
              <h3 className="text-xl font-bold text-white">Log Fitness Metrics</h3>
              <p className="text-xs text-gray-400 mt-1">Enter your weight and tape measurements below to update your analytics tracker.</p>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight (kg) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
                    placeholder="e.g. 71.5"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Log Date</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Measurements (Optional)</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Chest (in)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-sm outline-none"
                      placeholder="in"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Waist (in)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-sm outline-none"
                      placeholder="in"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Arms (in)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={arms}
                      onChange={(e) => setArms(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-sm outline-none"
                      placeholder="in"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-gray-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white text-xs font-semibold shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
