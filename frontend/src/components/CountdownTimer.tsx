import { Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface CountdownTimerProps {
  endTime?: Date;
  title?: string;
}

const CountdownTimer = ({ endTime, title = "Limited Time Offer" }: CountdownTimerProps) => {
  // Memoize default end time to prevent recreation on every render
  const defaultEndTime = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = endTime || defaultEndTime;
      const difference = end.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, defaultEndTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl animate-pulse-slow">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Clock size={24} className="animate-wiggle" />
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider mb-2">{title}</p>
          <div className="flex items-center gap-2">
            {/* Hours */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black timer-pulse">{formatNumber(timeLeft.hours)}</div>
              <div className="text-[10px] font-semibold opacity-90">HOURS</div>
            </div>
            <span className="text-2xl font-bold">:</span>
            {/* Minutes */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black timer-pulse">{formatNumber(timeLeft.minutes)}</div>
              <div className="text-[10px] font-semibold opacity-90">MINS</div>
            </div>
            <span className="text-2xl font-bold">:</span>
            {/* Seconds */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black animate-pulse">{formatNumber(timeLeft.seconds)}</div>
              <div className="text-[10px] font-semibold opacity-90">SECS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

