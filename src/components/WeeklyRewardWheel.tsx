import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface WeeklyRewardWheelProps {
  onRewardClaimed: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const REWARD_OPTIONS = [0, 1, 2, 3];
const COLORS = ["hsl(var(--destructive))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))"];

export const WeeklyRewardWheel = ({ onRewardClaimed, isOpen = true, onClose }: WeeklyRewardWheelProps) => {
  const [canSpin, setCanSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [wonCredits, setWonCredits] = useState(0);
  const [nextSpinDate, setNextSpinDate] = useState<Date | null>(null);

  useEffect(() => {
    checkSpinAvailability();
  }, []);

  const checkSpinAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check last spin
      const { data, error } = await supabase
        .from("weekly_spins")
        .select("spin_date")
        .eq("user_id", user.id)
        .order("spin_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking spin:", error);
        return;
      }

      if (!data) {
        setCanSpin(true);
        return;
      }

      const lastSpin = new Date(data.spin_date);
      const now = new Date();
      const daysSinceLastSpin = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastSpin >= 7) {
        setCanSpin(true);
      } else {
        const nextSpin = new Date(lastSpin);
        nextSpin.setDate(nextSpin.getDate() + 7);
        setNextSpinDate(nextSpin);
        setCanSpin(false);
      }
    } catch (error) {
      console.error("Error checking spin availability:", error);
    }
  };

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);

    // Random selection
    const selectedIndex = Math.floor(Math.random() * REWARD_OPTIONS.length);
    const credits = REWARD_OPTIONS[selectedIndex];

    // Calculate rotation (multiple spins + landing position)
    const baseRotation = 360 * 5; // 5 full spins
    const segmentAngle = 360 / REWARD_OPTIONS.length;
    const targetRotation = baseRotation + (segmentAngle * selectedIndex) + (segmentAngle / 2);

    setRotation(targetRotation);

    // Wait for animation
    setTimeout(async () => {
      setWonCredits(credits);
      setShowReward(true);
      setIsSpinning(false);

      // Save to database and update credits
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Save spin
        await supabase.from("weekly_spins").insert({
          user_id: user.id,
          credits_won: credits,
        });

        // Update user credits
        if (credits > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ credits: profile.credits + credits })
              .eq("id", user.id);
          }
        }

        setTimeout(() => {
          setShowReward(false);
          setCanSpin(false);
          const nextSpin = new Date();
          nextSpin.setDate(nextSpin.getDate() + 7);
          setNextSpinDate(nextSpin);
          onRewardClaimed();
          
          if (credits > 0) {
            toast.success(`You won ${credits} credit${credits > 1 ? 's' : ''}! 🎉`);
          } else {
            toast.info("Better luck next time! Try again next week!");
          }
        }, 3000);
      } catch (error) {
        console.error("Error saving spin:", error);
        toast.error("Failed to claim reward");
      }
    }, 4000);
  };

  const formatNextSpinTime = () => {
    if (!nextSpinDate) return "";
    const now = new Date();
    const diff = nextSpinDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed top-4 right-4 z-50 p-4 w-72 bg-gradient-to-br from-card/95 to-primary/5 backdrop-blur-sm border-primary/20 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SonicMode Gifts 🎁
          </h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="relative w-56 h-56 mx-auto mb-4">
        {/* Wheel */}
        <motion.div
          className="absolute inset-0 rounded-full shadow-2xl border-4 border-primary/50"
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: "easeOut" }}
        >
          {REWARD_OPTIONS.map((credits, index) => {
            const angle = (360 / REWARD_OPTIONS.length) * index;
            const segmentAngle = 360 / REWARD_OPTIONS.length;
            return (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${angle}deg)`,
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((0 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((0 - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segmentAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((segmentAngle - 90) * Math.PI / 180)}%)`,
                  background: COLORS[index],
                }}
              >
                <div
                  className="absolute top-[25%] left-1/2 -translate-x-1/2 text-white font-bold text-center whitespace-nowrap"
                  style={{
                    transform: `rotate(${segmentAngle / 2}deg)`,
                  }}
                >
                  <div className="text-3xl">{credits}</div>
                  <div className="text-xs mt-1">
                    {credits === 1 ? "Crédito" : "Créditos"}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Center pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-primary z-10"
          style={{ clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)" }}
        />

        {/* Center button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-background border-4 border-primary shadow-lg flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSpin}
        disabled={!canSpin || isSpinning}
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSpinning ? "Spinning..." : canSpin ? "Spin Now!" : `Next spin in ${formatNextSpinTime()}`}
      </Button>

      {/* Reward popup */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 bg-background/95 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Gift className="w-20 h-20 text-primary mb-4" />
            </motion.div>
            <h4 className="text-2xl font-bold text-primary mb-2">
              {wonCredits > 0 ? `You Won!` : "Almost!"}
            </h4>
            <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {wonCredits} {wonCredits === 1 ? "Credit" : "Credits"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};