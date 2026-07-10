import { useState, useEffect, useRef } from 'react';

export interface CountdownDuration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownDurationStrings {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export interface UseCountdownResult {
  timeLeft: number; // total seconds remaining
  duration: CountdownDuration;
  formatted: CountdownDurationStrings;
  hudDisplay: string; // e.g., "00:00:00:00"
  hudDisplayShort: string; // e.g., "00h:00m:00s"
  isExpired: boolean;
}

export const useCountdown = (
  targetDate: string | number | Date | null | undefined
): UseCountdownResult => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(0);
      return;
    }

    const targetTime = new Date(targetDate).getTime();
    if (isNaN(targetTime)) {
      console.warn('useCountdown: Invalid targetDate provided', targetDate);
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTime - now;
      const secondsRemaining = Math.max(0, Math.floor(difference / 1000));
      setTimeLeft(secondsRemaining);

      if (secondsRemaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Set interval to update every second
    timerRef.current = setInterval(calculateTimeLeft, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [targetDate]);

  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  const formatted: CountdownDurationStrings = {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };

  const hudDisplay = `${formatted.days}:${formatted.hours}:${formatted.minutes}:${formatted.seconds}`;
  const hudDisplayShort = `${formatted.hours}h:${formatted.minutes}m:${formatted.seconds}s`;

  return {
    timeLeft,
    duration: { days, hours, minutes, seconds },
    formatted,
    hudDisplay,
    hudDisplayShort,
    isExpired: timeLeft <= 0,
  };
};
