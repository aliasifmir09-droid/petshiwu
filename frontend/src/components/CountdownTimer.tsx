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
    days: 0,
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
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        // If countdown has ended, set all to 0
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, defaultEndTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-8 py-6 rounded-3xl shadow-2xl border-2 border-white/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Clock size={28} className="animate-wiggle text-yellow-200" />
          <p className="text-base font-bold uppercase tracking-wider">{title}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Days - Only show if more than 0 */}
          {timeLeft.days > 0 && (
            <>
              <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 min-w-[70px] border border-white/30 shadow-lg">
                <div className="text-3xl md:text-4xl font-black text-center timer-pulse">{formatNumber(timeLeft.days)}</div>
                <div className="text-xs font-bold uppercase opacity-95 text-center mt-1">DAYS</div>
              </div>
              <span className="text-3xl font-bold text-yellow-200">:</span>
            </>
          )}
          {/* Hours */}
          <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 min-w-[70px] border border-white/30 shadow-lg">
            <div className="text-3xl md:text-4xl font-black text-center timer-pulse">{formatNumber(timeLeft.hours)}</div>
            <div className="text-xs font-bold uppercase opacity-95 text-center mt-1">HOURS</div>
          </div>
          <span className="text-3xl font-bold text-yellow-200">:</span>
          {/* Minutes */}
          <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 min-w-[70px] border border-white/30 shadow-lg">
            <div className="text-3xl md:text-4xl font-black text-center timer-pulse">{formatNumber(timeLeft.minutes)}</div>
            <div className="text-xs font-bold uppercase opacity-95 text-center mt-1">MINS</div>
          </div>
          <span className="text-3xl font-bold text-yellow-200">:</span>
          {/* Seconds */}
          <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-3 min-w-[70px] border border-white/30 shadow-lg">
            <div className="text-3xl md:text-4xl font-black text-center animate-pulse">{formatNumber(timeLeft.seconds)}</div>
            <div className="text-xs font-bold uppercase opacity-95 text-center mt-1">SECS</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

