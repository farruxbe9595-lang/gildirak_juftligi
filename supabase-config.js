/*
  Supabase ulash bosqichi uchun konfiguratsiya.
  Hozircha enabled: false bo‘lsa, reyting ushbu qurilmaning localStorage xotirasida ishlaydi.

  Supabase tayyor bo‘lgandan keyin:
  1) enabled: true qiling
  2) url va anonKey qiymatlarini Supabase Project Settings -> API bo‘limidan oling
  3) supabase/SUPABASE_SCHEMA.sql faylini Supabase SQL Editor’da ishga tushiring
*/
window.SUPABASE_CONFIG = {
  enabled: false,
  url: "",
  anonKey: "",
  tables: {
    profiles: "ranked_profiles",
    attempts: "ranked_attempts"
  }
};
