"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const scenes = [
  {
    comment: "Price?",
    trigger: "VIDLIX detects the comment",
    dm: "Hi Rahul 👋 Thanks for your interest. Here are the details.",
    confirm: "Check your DM ✓",
  },
  {
    comment: "Location?",
    trigger: "Location detected",
    dm: "📍 Here's our location...",
    confirm: "Check your DM ✓",
  },
  {
    comment: "Link?",
    trigger: "Link request detected",
    dm: "🔗 Here's the link...",
    confirm: "Check your DM ✓",
  },
];

function Scene({
  scene,
  reduce,
  onComplete,
}: {
  scene: (typeof scenes)[number];
  reduce: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(reduce ? 7 : 0);
  const [typed, setTyped] = useState(reduce ? scene.comment : "");

  useEffect(() => {
    if (reduce) return;
    const timers = [280, 900, 1600, 2300, 3000, 3900, 5000, 6800];
    const ids = timers.map((ms, i) =>
      window.setTimeout(() => {
        if (i === 7) onComplete();
        else setStep(i + 1);
      }, ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [reduce, onComplete]);

  useEffect(() => {
    if (reduce || step < 2) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(scene.comment.slice(0, i));
      if (i >= scene.comment.length) window.clearInterval(id);
    }, 55);
    return () => {
      window.clearInterval(id);
      setTyped("");
    };
  }, [reduce, scene.comment, step]);

  return (
    <div className="flex min-h-[240px] flex-col justify-end gap-2.5 p-3 sm:min-h-[260px] sm:p-4">
      <AnimatePresence mode="wait">
        {step >= 1 ? (
          <motion.div
            key={scene.comment}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 shadow-sm"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Social comment
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {reduce ? scene.comment : typed || " "}
              {!reduce && step >= 2 && typed.length < scene.comment.length ? (
                <span className="ml-0.5 inline-block h-3.5 w-px bg-foreground align-middle" />
              ) : null}
            </p>
          </motion.div>
        ) : (
          <div className="h-[52px]" aria-hidden />
        )}
      </AnimatePresence>

      <div className="flex h-10 items-center gap-2">
        {step >= 3 ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent"
          >
            <span className="relative flex h-2 w-2">
              {!reduce ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
              ) : null}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Automation trigger · {scene.trigger}
          </motion.div>
        ) : null}
      </div>

      {step >= 4 ? (
        <motion.div
          className="ml-4 h-5 w-px origin-top bg-accent"
          initial={reduce ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
        />
      ) : (
        <div className="h-5" aria-hidden />
      )}

      {step >= 5 ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-auto max-w-[90%] rounded-2xl rounded-br-md border border-accent/20 bg-accent-soft px-3 py-2"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
            VIDLIX DM
          </p>
          <p className="mt-0.5 text-sm leading-5">{scene.dm}</p>
        </motion.div>
      ) : (
        <div className="h-[64px]" aria-hidden />
      )}

      <p className={`text-xs font-medium ${step >= 6 ? "text-success" : "text-transparent"}`}>
        {scene.confirm}
      </p>
    </div>
  );
}

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const scene = scenes[index]!;
  const onComplete = useCallback(() => {
    setIndex((value) => (value + 1) % scenes.length);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[440px] lg:ml-auto"
      aria-label="Product demonstration of comment to private reply"
    >
      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[var(--shadow)]">
        <div className="relative h-[148px] bg-[linear-gradient(165deg,#cfc9ff_0%,#eceef8_52%,#f7f7fa_100%)] dark:bg-[linear-gradient(165deg,#242a44_0%,#151923_100%)]">
          <div className="absolute inset-x-3 top-3 rounded-xl bg-black/75 px-3 py-2.5 text-white backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">Social post</p>
            <p className="mt-1 text-sm font-medium">Green Valley walkthrough</p>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-foreground/70">
            <span>Reel · 0:18</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium dark:bg-black/40">
              Demo
            </span>
          </div>
        </div>
        <Scene
          key={index}
          scene={scene}
          reduce={Boolean(reduce)}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
