import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Settings = Record<string, string>;

let cachedSettings: Settings | null = null;
let fetchPromise: Promise<Settings> | null = null;
let listeners: Array<(s: Settings) => void> = [];

const fetchSettings = async (force = false): Promise<Settings> => {
  if (!force && cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = (async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    const map: Settings = {};
    data?.forEach((r) => (map[r.key] = r.value));
    cachedSettings = map;
    fetchPromise = null;
    return map;
  })();
  
  return fetchPromise;
};

export const invalidateSettings = () => {
  cachedSettings = null;
  fetchPromise = null;
  // Re-fetch and notify all listeners
  fetchSettings(true).then((s) => {
    listeners.forEach((fn) => fn(s));
  });
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<Settings>(cachedSettings || {});
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
    const listener = (s: Settings) => setSettings(s);
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  const get = (key: string, fallback = "") => settings[key] || fallback;

  return { settings, get, loading };
};
