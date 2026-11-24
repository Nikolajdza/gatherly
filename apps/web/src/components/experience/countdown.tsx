"use client";

import { useEffect, useState } from "react";

type Labels = { days: string; hours: string; minutes: string; seconds: string };

function parts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown({ date, labels }: { date: string; labels: Labels }) {
  const target = new Date(`${date}T12:00:00`).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const value = now === null ? null : parts(target, now);
  const cell = (amount: number | undefined, label: string) => (
    <div>
      <b suppressHydrationWarning>{amount === undefined ? "–" : String(amount).padStart(2, "0")}</b>
      <small>{label}</small>
    </div>
  );
  return (
    <div className="xp-countdown" role="timer">
      {cell(value?.days, labels.days)}
      {cell(value?.hours, labels.hours)}
      {cell(value?.minutes, labels.minutes)}
      {cell(value?.seconds, labels.seconds)}
    </div>
  );
}
