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

  set: (key: string, value: string, days: number = 7): void => {
    if (typeof window === "undefined") return;
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
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
    CookieUtils.set(key, value, 30);
  },
  removeItem: (key: string): void => {
    CookieUtils.remove(key);
  }
};
