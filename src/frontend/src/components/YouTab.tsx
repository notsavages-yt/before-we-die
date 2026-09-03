import React, { useState, useEffect } from "react";
import { useMyProfile, useUpdateProfile } from "@/hooks/useQueries";
import { User, Calendar, Sparkles, Check, Heart } from "lucide-react";

export function YouTab() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setDob(profile.dob || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      displayName: displayName.trim(),
      dob,
      bio: bio.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Calculate percentage of life lived assuming 80-year horizon
  let lifeStats: { ageYears: number; livedPercent: number; daysLeft: number } | null = null;
  if (dob) {
    const birth = new Date(dob).getTime();
    const now = Date.now();
    const ageMs = now - birth;
    if (ageMs > 0) {
      const ageYears = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
      const targetAge = 80;
      const targetMs = birth + targetAge * 365.25 * 24 * 60 * 60 * 1000;
      const daysLeft = Math.max(0, Math.floor((targetMs - now) / (24 * 60 * 60 * 1000)));
      const livedPercent = Math.min(100, Math.max(0, Math.round((ageMs / (targetMs - birth)) * 100)));
      lifeStats = { ageYears, livedPercent, daysLeft };
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#7a482b] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-[#8c674b]">Identity</span>
        <h2 className="text-3xl font-serif font-bold text-[#321c10] mt-1">You</h2>
        <p className="text-[#6d513e] text-sm mt-1">
          Define how your fellow explorers see you on your shared journey.
        </p>
      </div>

      {lifeStats && (
        <div className="p-6 rounded-2xl bg-[#efe3d3]/70 border border-[#ddcbba] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-[#7a482b] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mortality perspective
            </span>
            <span className="text-sm font-semibold text-[#321c10] font-mono">
              {lifeStats.livedPercent}% lived
            </span>
          </div>

          <div className="w-full bg-[#dfcebe] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#7a482b] h-full rounded-full transition-all duration-700"
              style={{ width: `${lifeStats.livedPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#6d513e]">
            <span>Age: {lifeStats.ageYears} years</span>
            <span>~{lifeStats.daysLeft.toLocaleString()} days remaining</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="p-7 rounded-2xl bg-[#fdfaf7] border border-[#e8dacb] shadow-sm space-y-6">
        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aman"
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] placeholder-[#b59e8b] focus:outline-none focus:ring-2 focus:ring-[#7a482b]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] focus:outline-none focus:ring-2 focus:ring-[#7a482b]"
          />
          <p className="text-[11px] text-[#8c674b] mt-1.5">Used to calculate your life progress percentage.</p>
        </div>

        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Personal Bio / Motto
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What drives you to live fully before the time runs out?"
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] placeholder-[#b59e8b] focus:outline-none focus:ring-2 focus:ring-[#7a482b] resize-none"
          />
        </div>

        <div className="pt-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="px-6 py-2.5 rounded-xl bg-[#7a482b] text-white font-medium hover:bg-[#623820] transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving..." : "Save Identity"}
          </button>
          {saved && (
            <span className="text-xs text-[#2e5e34] font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Profile updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
