import React from 'react';
import { Calendar, Bell, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface ReminderBannerProps {
  role: UserRole;
  context: 'submission' | 'review';
  onClose?: () => void;
}

export function ReminderBanner({ role, context, onClose }: ReminderBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const now = new Date();
  const day = now.getDate();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  // Logic: 
  // Submission context: End of month (20th onwards) for those who submit (Employee & Manager)
  // Review context: Start of month (1st to 10th) for those who review (Manager & Admin)
  const isSubmissionContext = context === 'submission';
  const isReviewContext = context === 'review';
  
  const canSubmit = role === 'employee' || role === 'manager';
  const canReview = role === 'manager' || role === 'admin';

  const shouldShow = (isSubmissionContext && canSubmit && day >= 20) || 
                     (isReviewContext && canReview && day <= 10);

  if (!shouldShow || !isVisible) return null;

  // Decide visual state based on the context
  const isCycleClosingContext = isSubmissionContext;

  const getCalendarUrl = () => {
    const title = isCycleClosingContext 
      ? `Finalize ${monthName} LOE Submission` 
      : `Review Team LOE Submissions for ${new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString('en-US', { month: 'long' })}`;
    
    // Set for the end of the month or now
    const eventDate = isCycleClosingContext 
      ? new Date(year, now.getMonth() + 1, 0) 
      : new Date();
    
    const dateStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endStr = new Date(eventDate.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: isCycleClosingContext 
        ? `Reminder to finalize your effort allocations for ${monthName} in the PixelEdge LOE Portal.` 
        : `New team submissions are ready for your review for the previous reporting period.`,
      dates: `${dateStr}/${endStr}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "relative mb-6 p-4 lg:p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all shadow-sm overflow-hidden",
          isCycleClosingContext 
            ? "bg-amber-50 border-amber-200/60 text-amber-900" 
            : "bg-primary-base/5 border-primary-base/20 text-primary-dark"
        )}
      >
        {/* Background Accent */}
        <div className={cn(
          "absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] pointer-events-none",
          isCycleClosingContext ? "text-amber-900" : "text-primary-base"
        )}>
          <Calendar className="w-full h-full rotate-12" />
        </div>

        <div className={cn(
          "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0",
          isCycleClosingContext ? "bg-amber-100 text-amber-600" : "bg-primary-base/10 text-primary-base"
        )}>
          <Bell className="w-5 h-5 lg:w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-bold text-sm lg:text-base mb-1">
            {isCycleClosingContext ? "Cycle Closing Soon" : "Review Pendings Detected"}
          </h4>
          <p className="text-xs lg:text-sm font-medium opacity-80">
            {isCycleClosingContext 
              ? `The ${monthName} reporting period is ending. Please ensure your effort allocations are submitted by the 30th.`
              : `A new month has started. Please audit and approve team submissions for the previous period.`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={getCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest transition-all",
              isCycleClosingContext 
                ? "bg-white border-amber-200 text-amber-700 hover:bg-amber-100" 
                : "bg-white border-primary-base/30 text-primary-base hover:bg-primary-base/5"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Sync to Calendar
            <ExternalLink className="w-3 h-3 opacity-40 ml-1" />
          </a>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 opacity-40" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
