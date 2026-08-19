"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoginScreen } from "@/components/auth/LoginScreen";

interface AppConfig {
  id?: string;
  appName: string;
  me: {
    name: string;
    city: string;
    country: string;
    timezone: string;
    avatarColor: string;
    pin: string;
    mood?: string;
    pushToken?: string;
  };
  them: {
    name: string;
    city: string;
    country: string;
    timezone: string;
    avatarColor: string;
    pin: string;
    mood?: string;
    pushToken?: string;
  };
  startDate: string;
  customDistance: string;
  nextReunionDate: string;
  nextReunionLocation: string;
  nextCallTitle: string;
  nextCallTimeMe: string;
  nextCallTimeThem: string;
}

const DEFAULT_CONFIG: AppConfig = {
  appName: "derriam",
  customDistance: "3,132 km",
  me: {
    name: "Partner 1",
    city: "Kampala",
    country: "Uganda",
    timezone: "Africa/Kampala",
    avatarColor: "#C49030",
    pin: "0000",
  },
  them: {
    name: "Partner 2",
    city: "Riyadh",
    country: "Saudi Arabia",
    timezone: "Asia/Riyadh",
    avatarColor: "#4A6FA5",
    pin: "0000",
  },
  startDate: "March 14, 2024",
  nextReunionDate: "2026-12-25",
  nextReunionLocation: "London",
  nextCallTitle: "Movie Night",
  nextCallTimeMe: "8:00 PM EST",
  nextCallTimeThem: "1:00 AM GMT",
};

interface AppContextType {
  config: AppConfig;
  currentUser: "me" | "them" | null;
  setCurrentUser: (user: "me" | "them") => void;
  logout: () => void;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  updateMe: (updates: Partial<AppConfig["me"]>) => Promise<void>;
  updateThem: (updates: Partial<AppConfig["them"]>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [currentUser, _setCurrentUser] = useState<"me" | "them" | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Load device identity (only if they had successfully authenticated before)
    const savedUser = localStorage.getItem("derriam-user");
    const isAuthed = localStorage.getItem("derriam-authed") === "true";
    if (isAuthed && (savedUser === "me" || savedUser === "them")) {
      _setCurrentUser(savedUser);
    }

    async function loadConfig() {
      try {
        const { data, error } = await supabase.from("app_config").select("*").limit(1).single();
        if (data && !error) {
          setConfig({
            id: data.id,
            appName: data.app_name || "derriam",
            customDistance: data.custom_distance || "0 km",
            me: {
              name: data.me_name || "Partner 1",
              city: data.me_city || "Kampala",
              country: data.me_country || "Uganda",
              timezone: data.me_timezone || "Africa/Kampala",
              avatarColor: "#C49030",
              pin: data.me_pin || "0000",
              mood: data.me_mood,
              pushToken: data.me_push_token,
            },
            them: {
              name: data.them_name || "Partner 2",
              city: data.them_city || "Riyadh",
              country: data.them_country || "Saudi Arabia",
              timezone: data.them_timezone || "Asia/Riyadh",
              avatarColor: "#4A6FA5",
              pin: data.them_pin || "0000",
              mood: data.them_mood,
              pushToken: data.them_push_token,
            },
            startDate: data.start_date || "March 14, 2024",
            nextReunionDate: data.next_reunion_date || "",
            nextReunionLocation: data.next_reunion_location || "",
            nextCallTitle: data.next_call_title || "",
            nextCallTimeMe: data.next_call_my_time || "",
            nextCallTimeThem: data.next_call_their_time || "",
          });
        }
      } catch (e) {
        console.error("Failed to load config from Supabase", e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadConfig();

    // Listen for real-time changes
    const channel = supabase
      .channel('public:app_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_config' }, (payload) => {
        const data = payload.new;
        setConfig(prev => ({
          ...prev,
          appName: data.app_name,
          customDistance: data.custom_distance,
          startDate: data.start_date || prev.startDate,
          nextReunionDate: data.next_reunion_date || prev.nextReunionDate,
          nextReunionLocation: data.next_reunion_location || prev.nextReunionLocation,
          nextCallTitle: data.next_call_title || prev.nextCallTitle,
          nextCallTimeMe: data.next_call_my_time || prev.nextCallTimeMe,
          nextCallTimeThem: data.next_call_their_time || prev.nextCallTimeThem,
          me: { ...prev.me, name: data.me_name, city: data.me_city, country: data.me_country, pin: data.me_pin || prev.me.pin, mood: data.me_mood, pushToken: data.me_push_token },
          them: { ...prev.them, name: data.them_name, city: data.them_city, country: data.them_country, pin: data.them_pin || prev.them.pin, mood: data.them_mood, pushToken: data.them_push_token },
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const updateConfig = async (updates: Partial<AppConfig>) => {
    // Optimistic local update
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);

    // Save to DB
    if (config.id) {
      const payload: any = {};
      if (updates.appName !== undefined) payload.app_name = updates.appName;
      if (updates.customDistance !== undefined) payload.custom_distance = updates.customDistance;
      if (updates.startDate !== undefined) payload.start_date = updates.startDate;
      if (updates.nextReunionDate !== undefined) payload.next_reunion_date = updates.nextReunionDate;
      if (updates.nextReunionLocation !== undefined) payload.next_reunion_location = updates.nextReunionLocation;
      if (updates.nextCallTitle !== undefined) payload.next_call_title = updates.nextCallTitle;
      if (updates.nextCallTimeMe !== undefined) payload.next_call_my_time = updates.nextCallTimeMe;
      if (updates.nextCallTimeThem !== undefined) payload.next_call_their_time = updates.nextCallTimeThem;
      
      if (updates.me) {
        payload.me_name = updates.me.name;
        payload.me_city = updates.me.city;
        payload.me_country = updates.me.country;
        if (updates.me.pin) payload.me_pin = updates.me.pin;
        if (updates.me.mood !== undefined) payload.me_mood = updates.me.mood;
        if (updates.me.pushToken !== undefined) payload.me_push_token = updates.me.pushToken;
      }
      if (updates.them) {
        payload.them_name = updates.them.name;
        payload.them_city = updates.them.city;
        payload.them_country = updates.them.country;
        if (updates.them.pin) payload.them_pin = updates.them.pin;
        if (updates.them.mood !== undefined) payload.them_mood = updates.them.mood;
        if (updates.them.pushToken !== undefined) payload.them_push_token = updates.them.pushToken;
      }

      await supabase.from("app_config").update(payload).eq("id", config.id);
    }
  };

  const updateMe = async (updates: Partial<AppConfig["me"]>) => {
    await updateConfig({ me: { ...config.me, ...updates } });
  };

  const updateThem = async (updates: Partial<AppConfig["them"]>) => {
    await updateConfig({ them: { ...config.them, ...updates } });
  };

  const setCurrentUser = (user: "me" | "them") => {
    localStorage.setItem("derriam-user", user);
    localStorage.setItem("derriam-authed", "true"); // Mark as authenticated
    _setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("derriam-authed");
    _setCurrentUser(null);
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#080808]" />;

  return (
    <AppContext.Provider value={{ config, currentUser, setCurrentUser, logout, updateConfig, updateMe, updateThem }}>
      {!currentUser ? (
        <LoginScreen onLogin={setCurrentUser} config={config} />
      ) : (
        children
      )}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppProvider");
  return ctx;
}
