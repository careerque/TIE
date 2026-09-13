export const CookieUtils = {
  get: (key: string): string | null => {
    if (typeof window === "undefined" || !document.cookie) return null;
    const nameEQ = encodeURIComponent(key) + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        } catch {
          return c.substring(nameEQ.length, c.length);
        }
      }
    }
    return null;
  },

  // Store cookies strictly for 1 hour by default (hours = 1)
  set: (key: string, value: string, hours: number = 1): void => {
    if (typeof window === "undefined") return;
    let expires = "";
    let maxAge = "";
    if (hours) {
      const date = new Date();
      date.setTime(date.getTime() + hours * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
      maxAge = `; max-age=${Math.round(hours * 3600)}`;
    }
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}${expires}${maxAge}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; path=/; SameSite=Lax`;
  },

  clearAll: (): void => {
    if (typeof window === "undefined" || !document.cookie) return;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      const eqPos = ca[i].indexOf("=");
      const rawName = eqPos > -1 ? ca[i].substring(0, eqPos).trim() : ca[i].trim();
      try {
        const name = decodeURIComponent(rawName);
        CookieUtils.remove(name);
      } catch {
        CookieUtils.remove(rawName);
      }
    }
  }
};

export const supabaseCookieStorage = {
  getItem: (key: string): string | null => {
    return CookieUtils.get(key);
  },
  setItem: (key: string, value: string): void => {
    // Strictly store Supabase JWT auth token for 1 hour only (not 30 days)
    CookieUtils.set(key, value, 1);
  },
  removeItem: (key: string): void => {
    CookieUtils.remove(key);
  }
};
