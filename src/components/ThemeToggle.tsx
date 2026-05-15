'use client';

import { useEffect, useState } from 'react';

/** Returns true if current local time is daytime (6:00 AM – 6:00 PM) */
function isDaytime(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

function applyTheme(day: boolean) {
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.classList.toggle('day', day);
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 700);
}

export function ThemeToggle() {
  const [isDay, setIsDay] = useState(false);

  useEffect(() => {
    // Priority: manual override saved in localStorage → auto time-based
    const saved = localStorage.getItem('theme-manual');
    let day: boolean;

    if (saved === 'day' || saved === 'night') {
      day = saved === 'day';
    } else {
      // No manual override — use real-world time
      day = isDaytime();
    }

    setIsDay(day);
    document.documentElement.classList.toggle('day', day);

    // Auto-switch every minute if no manual override
    const interval = setInterval(() => {
      const manual = localStorage.getItem('theme-manual');
      if (!manual) {
        const autoDay = isDaytime();
        const current = document.documentElement.classList.contains('day');
        if (autoDay !== current) {
          setIsDay(autoDay);
          applyTheme(autoDay);
        }
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const toggle = () => {
    const newDay = !isDay;
    setIsDay(newDay);
    // Save manual override
    localStorage.setItem('theme-manual', newDay ? 'day' : 'night');
    applyTheme(newDay);
  };

  return (
    <button
      onClick={toggle}
      className={`theme-toggle ${isDay ? 'day' : 'night'}`}
      aria-label={isDay ? 'Switch to night mode' : 'Switch to day mode'}
      title={isDay ? 'Night mode 🌙' : 'Day mode ☀️'}
    >
      <div className="toggle-bg" />
      <div className="theme-toggle-knob" />
    </button>
  );
}
