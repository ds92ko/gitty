"use client";

import Image from "next/image";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const GITHUB_REPOSITORY_URL = "https://github.com/ds92ko/gitty";
const GITHUB_PROFILE_URL = "https://github.com/ds92ko";
const WIDGET_ORIGIN = "https://gitty-widget.vercel.app";
const GITHUB_USERNAME_PATTERN =
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const POSITIVE_MARQUEE_STATES = [
  "normal",
  "coding",
  "happy",
  "cheering",
  "excited",
  "proud",
  "love",
] as const;

const HUNGER_MARQUEE_STATES = [
  "waiting",
  "nervous",
  "crying",
  "angry",
  "tired",
  "burned_out",
  "sleeping",
] as const;

const COMMIT_RAIN_TILES = [
  { left: 4, size: 14, duration: 15, delay: -3, level: 1 },
  { left: 12, size: 18, duration: 18, delay: -11, level: 2 },
  { left: 21, size: 12, duration: 13, delay: -7, level: 0 },
  { left: 29, size: 16, duration: 17, delay: -15, level: 3 },
  { left: 38, size: 14, duration: 14, delay: -5, level: 1 },
  { left: 47, size: 18, duration: 20, delay: -18, level: 2 },
  { left: 56, size: 12, duration: 16, delay: -9, level: 0 },
  { left: 64, size: 16, duration: 19, delay: -2, level: 1 },
  { left: 72, size: 14, duration: 14, delay: -12, level: 3 },
  { left: 81, size: 18, duration: 18, delay: -6, level: 2 },
  { left: 90, size: 12, duration: 16, delay: -14, level: 1 },
  { left: 96, size: 16, duration: 21, delay: -8, level: 0 },
  { left: 17, size: 14, duration: 22, delay: -19, level: 2 },
  { left: 76, size: 12, duration: 20, delay: -4, level: 1 },
  { left: 8, size: 14, duration: 19, delay: -16, level: 0 },
  { left: 33, size: 16, duration: 23, delay: -10, level: 2 },
  { left: 59, size: 14, duration: 17, delay: -13, level: 1 },
  { left: 87, size: 16, duration: 22, delay: -20, level: 3 },
] as const;

const FINAL_GRASS_COLUMNS = 40;
const FINAL_GRASS_ROWS = 20;
const FINAL_GRASS_COLOR_TOKENS = [
  "--grass-empty",
  "--grass-lightest",
  "--grass-light",
  "--grass-medium",
  "--grass-strong",
] as const;
const FINAL_GRASS_LEVELS = Array.from(
  { length: FINAL_GRASS_COLUMNS * FINAL_GRASS_ROWS },
  (_, index) => {
    const column = index % FINAL_GRASS_COLUMNS;
    const row = Math.floor(index / FINAL_GRASS_COLUMNS);
    const value =
      (index * 37 + column * 11 + row * 17 + index * index) % 100;

    if (value < 36) return 0;
    if (value < 57) return 1;
    if (value < 75) return 2;
    return 3;
  },
);

function FinalGrassCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const section = canvas.closest<HTMLElement>(".final-section");
    const copy = section?.querySelector<HTMLElement>(".final-copy");
    const context = canvas.getContext("2d");

    if (!section || !copy || !context) {
      return;
    }

    const canvasElement: HTMLCanvasElement = canvas;
    const copyElement: HTMLElement = copy;
    const drawingContext: CanvasRenderingContext2D = context;
    const sectionStyles = getComputedStyle(section);
    const grassColors = FINAL_GRASS_COLOR_TOKENS.map((token) =>
      sectionStyles.getPropertyValue(token).trim(),
    );
    const grassHoverColor = grassColors.at(-1) ?? grassColors[0];
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const highlightUntil = new Float64Array(FINAL_GRASS_LEVELS.length);
    const highlightTimers = new Map<
      number,
      ReturnType<typeof setTimeout>
    >();
    const animatedLevels = Uint8Array.from(FINAL_GRASS_LEVELS);
    const nextLevelChange = new Float64Array(FINAL_GRASS_LEVELS.length);
    const renderedLevels = new Int8Array(FINAL_GRASS_LEVELS.length);
    const renderedHighlights = new Uint8Array(FINAL_GRASS_LEVELS.length);
    renderedLevels.fill(-1);
    renderedHighlights.fill(2);
    let cssWidth = 0;
    let cssHeight = 0;
    let isVisible = false;
    let hoveredIndex: number | null = null;
    let lastPointerPosition: { x: number; y: number } | null = null;
    let quietZone:
      | { left: number; top: number; right: number; bottom: number }
      | null = null;
    let animationTimer: ReturnType<typeof setInterval> | null = null;

    function pickNextLevel(currentLevel: number) {
      let nextLevel = currentLevel;

      while (nextLevel === currentLevel) {
        const value = Math.random() * 100;

        if (value < 36) nextLevel = 0;
        else if (value < 57) nextLevel = 1;
        else if (value < 75) nextLevel = 2;
        else nextLevel = 3;
      }

      return nextLevel;
    }

    function scheduleLevelChanges(now = performance.now()) {
      nextLevelChange.forEach((_, index) => {
        nextLevelChange[index] = now + 3000 + Math.random() * 5000;
      });
    }

    function draw(now = performance.now(), force = false) {
      if (!cssWidth || !cssHeight) {
        return;
      }

      const gap = Math.min(8, Math.max(4, window.innerWidth * 0.004));
      const cellWidth =
        (cssWidth - gap * (FINAL_GRASS_COLUMNS - 1)) /
        FINAL_GRASS_COLUMNS;
      const cellHeight =
        (cssHeight - gap * (FINAL_GRASS_ROWS + 1)) / FINAL_GRASS_ROWS;

      if (force) {
        drawingContext.clearRect(0, 0, cssWidth, cssHeight);
        renderedLevels.fill(-1);
        renderedHighlights.fill(2);
      }

      drawingContext.shadowColor = "transparent";
      drawingContext.shadowBlur = 0;
      drawingContext.shadowOffsetY = 0;

      FINAL_GRASS_LEVELS.forEach((initialLevel, index) => {
        const column = index % FINAL_GRASS_COLUMNS;
        const row = Math.floor(index / FINAL_GRASS_COLUMNS);

        if (
          !reducedMotionQuery.matches &&
          now >= nextLevelChange[index]
        ) {
          animatedLevels[index] = pickNextLevel(animatedLevels[index]);
          nextLevelChange[index] = now + 3000 + Math.random() * 5000;
        }

        let level = reducedMotionQuery.matches
          ? initialLevel
          : animatedLevels[index];
        const x = column * (cellWidth + gap);
        const y = gap + row * (cellHeight + gap);
        const centerX = x + cellWidth / 2;
        const centerY = y + cellHeight / 2;

        if (quietZone) {
          const distanceX = Math.max(
            quietZone.left - centerX,
            0,
            centerX - quietZone.right,
          );
          const distanceY = Math.max(
            quietZone.top - centerY,
            0,
            centerY - quietZone.bottom,
          );
          const quietStrength = Math.max(
            0,
            1 - Math.hypot(distanceX, distanceY) / 100,
          );

          if (quietStrength > 0) {
            const maxLevelValue = 3 - quietStrength * 2;
            const lowerLevel = Math.floor(maxLevelValue);
            const upperLevel = Math.ceil(maxLevelValue);
            const threshold = upperLevel - maxLevelValue;
            const seed = ((index * 53 + row * 19) % 100) / 100;
            const maxLevel =
              seed < threshold ? lowerLevel : upperLevel;
            level = Math.min(level, maxLevel);
          }
        }

        const isHighlighted =
          hoveredIndex === index || highlightUntil[index] > now;

        if (
          !force &&
          renderedLevels[index] === level &&
          renderedHighlights[index] === Number(isHighlighted)
        ) {
          return;
        }

        if (!force) {
          drawingContext.clearRect(
            x - 2,
            y - 2,
            cellWidth + 4,
            cellHeight + 4,
          );
        }

        drawingContext.fillStyle = isHighlighted
          ? grassHoverColor
          : grassColors[level];
        drawingContext.beginPath();
        drawingContext.roundRect(x, y, cellWidth, cellHeight, 4);
        drawingContext.fill();
        renderedLevels[index] = level;
        renderedHighlights[index] = Number(isHighlighted);
      });
    }

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const copyRect = copyElement.getBoundingClientRect();
      const horizontalPadding = Math.min(
        90,
        Math.max(44, window.innerWidth * 0.06),
      );
      const verticalPadding = Math.min(
        72,
        Math.max(36, window.innerHeight * 0.06),
      );

      cssWidth = rect.width;
      cssHeight = rect.height;
      quietZone = {
        left: copyRect.left - rect.left - horizontalPadding,
        top: copyRect.top - rect.top - verticalPadding,
        right: copyRect.right - rect.left + horizontalPadding,
        bottom: copyRect.bottom - rect.top + verticalPadding,
      };
      canvasElement.width = Math.round(cssWidth);
      canvasElement.height = Math.round(cssHeight);
      drawingContext.setTransform(1, 0, 0, 1, 0, 0);
      draw(performance.now(), true);
    }

    function stopAnimation() {
      if (animationTimer) {
        clearInterval(animationTimer);
        animationTimer = null;
      }
    }

    function syncAnimation() {
      stopAnimation();

      if (isVisible && !reducedMotionQuery.matches) {
        animationTimer = setInterval(() => draw(), 500);
      }

      draw();
    }

    function holdHighlight(index: number) {
      const previousTimer = highlightTimers.get(index);

      if (previousTimer) {
        clearTimeout(previousTimer);
      }

      highlightUntil[index] = performance.now() + 3000;
      highlightTimers.set(
        index,
        setTimeout(() => {
          highlightUntil[index] = 0;
          highlightTimers.delete(index);
          draw();
        }, 3000),
      );
    }

    function setHoveredIndex(nextIndex: number | null) {
      if (hoveredIndex === nextIndex) {
        return;
      }

      if (hoveredIndex !== null) {
        holdHighlight(hoveredIndex);
      }

      hoveredIndex = nextIndex;

      if (nextIndex !== null) {
        const nextTimer = highlightTimers.get(nextIndex);

        if (nextTimer) {
          clearTimeout(nextTimer);
          highlightTimers.delete(nextIndex);
        }

        highlightUntil[nextIndex] = 0;
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return;
      }

      const rect = canvasElement.getBoundingClientRect();
      const gap = Math.min(8, Math.max(4, window.innerWidth * 0.004));
      const cellWidth =
        (rect.width - gap * (FINAL_GRASS_COLUMNS - 1)) /
        FINAL_GRASS_COLUMNS;
      const cellHeight =
        (rect.height - gap * (FINAL_GRASS_ROWS + 1)) / FINAL_GRASS_ROWS;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top - gap;

      function getCellIndex(pointX: number, pointY: number) {
        const column = Math.floor(pointX / (cellWidth + gap));
        const row = Math.floor(pointY / (cellHeight + gap));
        const isInsideCell =
          column >= 0 &&
          column < FINAL_GRASS_COLUMNS &&
          row >= 0 &&
          row < FINAL_GRASS_ROWS &&
          pointX - column * (cellWidth + gap) <= cellWidth &&
          pointY - row * (cellHeight + gap) <= cellHeight;

        return isInsideCell
          ? row * FINAL_GRASS_COLUMNS + column
          : null;
      }

      const nextIndex = getCellIndex(x, y);
      const passedIndices = new Set<number>();

      if (lastPointerPosition) {
        const distance = Math.hypot(
          x - lastPointerPosition.x,
          y - lastPointerPosition.y,
        );
        const sampleInterval = Math.max(
          2,
          Math.min(cellWidth, cellHeight) * 0.35,
        );
        const sampleCount = Math.ceil(distance / sampleInterval);

        for (let sample = 0; sample <= sampleCount; sample += 1) {
          const progress = sampleCount ? sample / sampleCount : 1;
          const index = getCellIndex(
            lastPointerPosition.x +
              (x - lastPointerPosition.x) * progress,
            lastPointerPosition.y +
              (y - lastPointerPosition.y) * progress,
          );

          if (index !== null) {
            passedIndices.add(index);
          }
        }
      } else if (nextIndex !== null) {
        passedIndices.add(nextIndex);
      }

      passedIndices.forEach((index) => {
        if (index !== nextIndex && index !== hoveredIndex) {
          holdHighlight(index);
        }
      });

      lastPointerPosition = { x, y };
      setHoveredIndex(nextIndex);
      draw();
    }

    function handlePointerLeave() {
      setHoveredIndex(null);
      lastPointerPosition = null;
      draw();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncAnimation();
    });

    resizeObserver.observe(canvasElement);
    resizeObserver.observe(copyElement);
    intersectionObserver.observe(section);
    reducedMotionQuery.addEventListener("change", syncAnimation);
    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
    scheduleLevelChanges();
    resize();

    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", syncAnimation);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
      highlightTimers.forEach(clearTimeout);
      highlightTimers.clear();
    };
  }, []);

  return <canvas ref={canvasRef} className="final-grass" aria-hidden="true" />;
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.3-5.27-1.28-5.27-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.94 10.94 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.24c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

interface UsernameFormProps {
  id: string;
  username: string;
  invalid: boolean;
  onUsernameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function UsernameForm({
  id,
  username,
  invalid,
  onUsernameChange,
  onSubmit,
}: UsernameFormProps) {
  return (
    <div className="username-block">
      <form
        className={`username-form${invalid ? " is-invalid" : ""}`}
        onSubmit={onSubmit}
      >
        <label className="sr-only" htmlFor={id}>
          GitHub username
        </label>
        <span className="input-icon">
          <GitHubIcon />
        </span>
        <input
          id={id}
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="GitHub username"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid}
        />
        <button type="submit">
          만나기
        </button>
      </form>
    </div>
  );
}

export function GittyLanding() {
  const [username, setUsername] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const initialGittyRef = useRef<HTMLDivElement>(null);
  const worksSectionRef = useRef<HTMLElement>(null);
  const storyStepRefs = useRef<Array<HTMLElement | null>>([]);
  const meetSectionRef = useRef<HTMLElement>(null);
  const hungerTrackRef = useRef<HTMLDivElement>(null);
  const positiveTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const revealElements =
      document.querySelectorAll<HTMLElement>("[data-section-reveal]");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotionQuery.matches) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            entry.target.classList.remove("is-visible");
            return;
          }

          if (entry.intersectionRatio >= 0.35) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        threshold: [0, 0.35],
        rootMargin: "0px 0px -12% 0px",
      },
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frameId: number | null = null;

    function drawProgress() {
      frameId = null;
      const progressBar = scrollProgressRef.current;

      if (!progressBar) {
        return;
      }

      const scrollRange =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollRange > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollRange))
          : 0;

      progressBar.style.transform = `scaleX(${progress})`;
    }

    function updateProgress() {
      if (frameId === null) {
        frameId = requestAnimationFrame(drawProgress);
      }
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frameId: number | null = null;

    function resetPetPosition() {
      const pet = initialGittyRef.current;

      if (!pet) {
        return;
      }

      pet.style.setProperty("--cat-x", "0px");
      pet.style.setProperty("--cat-y", "0px");
      pet.style.setProperty("--bowl-x", "0px");
      pet.style.setProperty("--bowl-y", "0px");
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || reducedMotionQuery.matches) {
        return;
      }

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;

      frameId = requestAnimationFrame(() => {
        frameId = null;
        const pet = initialGittyRef.current;

        if (!pet) {
          return;
        }

        pet.style.setProperty("--cat-x", `${x * 16}px`);
        pet.style.setProperty("--cat-y", `${y * 16}px`);
        pet.style.setProperty("--bowl-x", `${x * 28}px`);
        pet.style.setProperty("--bowl-y", `${y * 28}px`);
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", resetPetPosition);
    reducedMotionQuery.addEventListener("change", resetPetPosition);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPetPosition);
      reducedMotionQuery.removeEventListener("change", resetPetPosition);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const section = meetSectionRef.current;
    const hungerTrack = hungerTrackRef.current;
    const positiveTrack = positiveTrackRef.current;
    const moodColumns = hungerTrack?.closest<HTMLElement>(".mood-columns");

    if (!section || !hungerTrack || !positiveTrack || !moodColumns) {
      return;
    }

    const sectionElement = section;
    const hungerTrackElement = hungerTrack;
    const positiveTrackElement = positiveTrack;
    const moodColumnsElement = moodColumns;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const horizontalLayoutQuery = window.matchMedia("(max-width: 900px)");
    let frameId: number | null = null;
    let trackStep = 0;
    let trackInset = 36;

    function resetTracks() {
      hungerTrackElement.style.removeProperty("transform");
      positiveTrackElement.style.removeProperty("transform");
    }

    function measureTracks() {
      const firstPositiveItem =
        positiveTrackElement.firstElementChild as HTMLElement | null;

      if (!firstPositiveItem) {
        trackStep = 0;
        return;
      }

      const gap =
        Number.parseFloat(getComputedStyle(positiveTrackElement).gap) || 0;
      const itemSize = horizontalLayoutQuery.matches
        ? firstPositiveItem.offsetWidth
        : firstPositiveItem.offsetHeight;

      trackStep = itemSize + gap;
      trackInset = horizontalLayoutQuery.matches ? 24 : 36;
      updateTracks();
    }

    function drawTracks() {
      frameId = null;
      const sectionTop = sectionElement.getBoundingClientRect().top;
      const revealProgress = reducedMotionQuery.matches
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              1 - sectionTop / (window.innerHeight * 0.5),
            ),
          );

      moodColumnsElement.style.opacity = String(revealProgress);

      if (reducedMotionQuery.matches) {
        resetTracks();
        return;
      }

      const scrollDistance = Math.max(
        (sectionElement.offsetHeight - window.innerHeight) * 0.86,
        1,
      );
      const scrollBeforeFinalSection = Math.max(
        sectionElement.offsetHeight - window.innerHeight * 2,
        0,
      );
      const scrollOffset = Math.min(
        scrollBeforeFinalSection,
        Math.max(0, -sectionElement.getBoundingClientRect().top),
      );
      const maxProgress = Math.min(
        1,
        scrollBeforeFinalSection / scrollDistance,
      );
      const progress = Math.min(maxProgress, scrollOffset / scrollDistance);

      function getStaggerCorrection(
        hungerTravel: number,
        positiveTravel: number,
        positiveStagger: number,
      ) {
        if (!trackStep || !maxProgress) {
          return 0;
        }

        const relativePositionAtStop =
          -positiveTravel +
          positiveStagger +
          (positiveTravel + hungerTravel) * maxProgress;
        const currentPhase =
          ((relativePositionAtStop % trackStep) + trackStep) % trackStep;
        let correction = trackStep / 2 - currentPhase;

        if (correction > trackStep / 2) {
          correction -= trackStep;
        } else if (correction < -trackStep / 2) {
          correction += trackStep;
        }

        const correctionProgress = Math.min(1, progress / maxProgress);
        const easedProgress =
          correctionProgress *
          correctionProgress *
          (3 - 2 * correctionProgress);

        return correction * easedProgress;
      }

      if (horizontalLayoutQuery.matches) {
        const hungerViewportWidth =
          hungerTrackElement.parentElement?.clientWidth ?? 0;
        const positiveViewportWidth =
          positiveTrackElement.parentElement?.clientWidth ?? 0;
        const hungerTravel = Math.max(
          hungerTrackElement.scrollWidth - hungerViewportWidth,
          0,
        );
        const positiveTravel = Math.max(
          positiveTrackElement.scrollWidth - positiveViewportWidth,
          0,
        );
        const positiveStagger = trackStep
          ? (positiveTravel + trackStep / 2) % trackStep
          : 0;
        const staggerCorrection = getStaggerCorrection(
          hungerTravel,
          positiveTravel,
          positiveStagger,
        );

        hungerTrackElement.style.transform = `translate3d(${trackInset - hungerTravel * progress}px, 0, 0)`;
        positiveTrackElement.style.transform = `translate3d(${trackInset - positiveTravel * (1 - progress) + positiveStagger + staggerCorrection}px, 0, 0)`;
        return;
      }

      const hungerViewportHeight =
        hungerTrackElement.parentElement?.clientHeight ?? 0;
      const positiveViewportHeight =
        positiveTrackElement.parentElement?.clientHeight ?? 0;
      const hungerTravel = Math.max(
        hungerTrackElement.scrollHeight - hungerViewportHeight,
        0,
      );
      const positiveTravel = Math.max(
        positiveTrackElement.scrollHeight - positiveViewportHeight,
        0,
      );
      const positiveStagger = trackStep
        ? (positiveTravel + trackStep / 2) % trackStep
        : 0;
      const staggerCorrection = getStaggerCorrection(
        hungerTravel,
        positiveTravel,
        positiveStagger,
      );

      hungerTrackElement.style.transform = `translate3d(0, ${trackInset - hungerTravel * progress}px, 0)`;
      positiveTrackElement.style.transform = `translate3d(0, ${trackInset - positiveTravel * (1 - progress) + positiveStagger + staggerCorrection}px, 0)`;
    }

    function updateTracks() {
      if (frameId === null) {
        frameId = requestAnimationFrame(drawTracks);
      }
    }

    window.addEventListener("scroll", updateTracks, { passive: true });
    window.addEventListener("resize", measureTracks);
    reducedMotionQuery.addEventListener("change", updateTracks);
    horizontalLayoutQuery.addEventListener("change", measureTracks);
    measureTracks();

    return () => {
      window.removeEventListener("scroll", updateTracks);
      window.removeEventListener("resize", measureTracks);
      reducedMotionQuery.removeEventListener("change", updateTracks);
      horizontalLayoutQuery.removeEventListener("change", measureTracks);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      resetTracks();
      moodColumnsElement.style.removeProperty("opacity");
    };
  }, []);

  useEffect(() => {
    const section = worksSectionRef.current;
    const storyFlow =
      section?.querySelector<HTMLElement>(".story-flow");
    const steps = storyStepRefs.current.filter(
      (step): step is HTMLElement => step !== null,
    );

    if (!section || !storyFlow || steps.length === 0) {
      return;
    }

    const sectionElement = section;
    const storyFlowElement = storyFlow;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const staticLayoutQuery = window.matchMedia(
      "(max-width: 900px), (prefers-reduced-motion: reduce)",
    );
    let frameId: number | null = null;
    let currentProgress = 0;
    let targetProgress = 0;

    function resetSteps() {
      steps.forEach((step) => {
        step.style.removeProperty("opacity");
        step.style.removeProperty("transform");
        step.style.removeProperty("z-index");
      });
    }

    function drawSteps() {
      const activeStep = currentProgress * (steps.length - 1);

      steps.forEach((step, index) => {
        const relativePosition = index - activeStep;
        const distance = Math.abs(relativePosition);
        const translateX = relativePosition * 108;
        const scale = 1 - Math.min(distance, 1) * 0.045;
        const opacity =
          distance > 1.2
            ? 0
            : 1 - Math.max(0, distance - 0.82) * 2.6;

        step.style.transform = `translate3d(${translateX}%, 0, 0) scale(${scale})`;
        step.style.opacity = String(Math.max(0, opacity));
        step.style.zIndex = String(10 - Math.round(distance * 2));
      });
    }

    function animate() {
      const difference = targetProgress - currentProgress;

      currentProgress += difference * 0.14;
      drawSteps();

      if (Math.abs(difference) > 0.001) {
        frameId = requestAnimationFrame(animate);
      } else {
        currentProgress = targetProgress;
        drawSteps();
        frameId = null;
      }
    }

    function updateProgress() {
      const sectionTop = sectionElement.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const revealProgress = reducedMotionQuery.matches
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              1 - sectionTop / (viewportHeight * 0.5),
            ),
          );

      storyFlowElement.style.opacity = String(revealProgress);

      if (staticLayoutQuery.matches) {
        resetSteps();
        return;
      }

      const scrollDistance = Math.max(
        sectionElement.offsetHeight - window.innerHeight,
        1,
      );
      const rawProgress = Math.max(0, -sectionTop / scrollDistance);
      const transitionEnd = 0.86;

      targetProgress = Math.min(
        1,
        rawProgress / transitionEnd,
      );

      if (frameId === null) {
        frameId = requestAnimationFrame(animate);
      }
    }

    function handleLayoutChange() {
      if (staticLayoutQuery.matches) {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }

        resetSteps();
        return;
      }

      updateProgress();
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    staticLayoutQuery.addEventListener("change", handleLayoutChange);
    updateProgress();

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      staticLayoutQuery.removeEventListener("change", handleLayoutChange);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      resetSteps();
      storyFlowElement.style.removeProperty("opacity");
    };
  }, []);

  const widgetUrl = activeUsername
    ? `${WIDGET_ORIGIN}/api/widget?username=${encodeURIComponent(activeUsername)}`
    : null;
  const markdown = widgetUrl ? `![Gitty](${widgetUrl})` : "";
  const hasValidUsername = GITHUB_USERNAME_PATTERN.test(username.trim());

  function handleUsernameChange(value: string) {
    setUsername(value);
    setActiveUsername(null);
    setCopied(false);
    setIsWidgetLoading(false);
    const normalizedUsername = value.trim();

    if (!normalizedUsername) {
      setError(null);
      return;
    }

    if (!GITHUB_USERNAME_PATTERN.test(normalizedUsername)) {
      setError("GitHub username을 다시 확인해 보라냥");
      return;
    }

    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setUsername("");
      setActiveUsername(null);
      setError(null);
      setCopied(false);
      setIsWidgetLoading(false);
      return;
    }

    if (!GITHUB_USERNAME_PATTERN.test(normalizedUsername)) {
      setActiveUsername(null);
      setError("GitHub username을 다시 확인해 보라냥");
      setCopied(false);
      setIsWidgetLoading(false);
      return;
    }

    setUsername(normalizedUsername);
    setActiveUsername(normalizedUsername);
    setError(null);
    setCopied(false);
    setIsWidgetLoading(activeUsername !== normalizedUsername);
  }

  async function copyMarkdown() {
    if (!markdown) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setCopied(true);

    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
    }

    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="landing-shell">
      <div
        ref={scrollProgressRef}
        className="scroll-progress"
        aria-hidden="true"
      />
      <header className="site-header">
        <Image
          src="/brand/logo.png"
          alt="Gitty"
          width={112}
          height={36}
          priority
        />
        <a
          className="github-link"
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIcon />
          <span>GitHub</span>
        </a>
      </header>

      <main>
        <section
          className="hero-section"
          data-section-reveal
        >
          <div className="hero-copy">
            <p className="eyebrow">YOUR GITHUB PET</p>
            <h1>GitHub 활동을 먹고 자라는 고양이, Gitty</h1>
            <p className="hero-description">
              오늘 나의 Gitty는 어떤 모습일까요?
            </p>
          </div>

          <UsernameForm
            id="hero-username"
            username={username}
            invalid={Boolean(error)}
            onUsernameChange={handleUsernameChange}
            onSubmit={handleSubmit}
          />

          <div className="hero-stage" aria-live="polite">
            {widgetUrl ? (
              <div
                className={`widget-result${isWidgetLoading ? " is-loading" : ""}`}
                aria-busy={isWidgetLoading}
              >
                <div className="widget-preview-frame">
                  <Image
                    key={widgetUrl}
                    className="widget-preview"
                    src={`/api/widget?username=${encodeURIComponent(activeUsername ?? "")}`}
                    alt={`${activeUsername}의 Gitty 위젯`}
                    width={614}
                    height={274}
                    unoptimized
                    onLoad={() => setIsWidgetLoading(false)}
                    onError={() => setIsWidgetLoading(false)}
                  />
                  {isWidgetLoading ? (
                    <div className="widget-loader" role="status">
                      <div
                        className="contribution-dots widget-loading-dots"
                        aria-hidden="true"
                      >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                      <p>Gitty를 만나러 가는 중...</p>
                    </div>
                  ) : null}
                </div>
                <div className="markdown-area">
                  <span>README에 추가하기</span>
                  <div className="markdown-copy">
                    <code>{markdown}</code>
                    <button
                      type="button"
                      onClick={copyMarkdown}
                      aria-label={copied ? "복사됨" : "Markdown 복사"}
                      title={copied ? "복사됨" : "복사"}
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="initial-state">
                <p
                  className="form-error"
                  role={error ? "alert" : undefined}
                  aria-hidden={!error}
                >
                  {error ?? "\u00A0"}
                </p>
                <div className="initial-gitty" ref={initialGittyRef}>
                  <div className="initial-pet-scene">
                    <Image
                      className="idle-gitty"
                    src={
                      error
                        ? "/cats/confused.png"
                        : hasValidUsername
                          ? "/cats/happy.png"
                          : "/cats/waiting.png"
                    }
                      alt={
                        error
                          ? "입력값을 이해하지 못한 Gitty"
                        : hasValidUsername
                          ? "입력값을 반기는 Gitty"
                          : "집사를 기다리는 Gitty"
                      }
                      width={300}
                      height={300}
                      priority
                    />
                    {!error ? (
                      <Image
                        className="hero-bowl"
                        src={
                          hasValidUsername
                            ? "/activity/bowl_full.png"
                            : "/activity/bowl_empty.png"
                        }
                        alt={hasValidUsername ? "가득 찬 밥그릇" : "빈 밥그릇"}
                        width={128}
                        height={90}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className="works-section"
          id="how-it-works"
          ref={worksSectionRef}
        >
          <div className="commit-rain" aria-hidden="true">
            {COMMIT_RAIN_TILES.map((tile, index) => (
              <i
                className={`commit-rain-tile commit-rain-level-${tile.level}`}
                key={`${tile.left}-${index}`}
                style={{
                  left: `${tile.left}%`,
                  width: `${tile.size}px`,
                  height: `${tile.size}px`,
                  animationDelay: `${tile.delay}s`,
                  animationDuration: `${tile.duration}s`,
                }}
              />
            ))}
          </div>
          <div className="works-sticky">
            <div
              className="section-heading section-reveal"
              data-section-reveal
            >
              <p className="eyebrow">HOW GITTY WORKS</p>
              <h2>Gitty는 이렇게 자라요</h2>
            </div>

            <div className="story-flow">
              <article
                className="story-step"
                ref={(step) => {
                  storyStepRefs.current[0] = step;
                }}
              >
                <div className="story-copy">
                  <span className="step-number">01</span>
                  <h3>GitHub 활동이 Gitty의 먹이가 돼요</h3>
                  <p>
                    하루에 하나 이상의 contribution이 있다면 Gitty의
                    밥그릇이 채워져요.
                  </p>
                </div>
              <div className="feeding-visual" aria-hidden="true">
                <div className="contribution-dots">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <Image
                  src="/activity/bowl_full.png"
                  alt=""
                  width={176}
                  height={124}
                />
              </div>
              </article>

              <article
                className="story-step"
                ref={(step) => {
                  storyStepRefs.current[1] = step;
                }}
              >
                <div className="story-copy">
                  <span className="step-number">02</span>
                  <h3>꾸준한 활동이 Gitty의 기분을 바꿔요</h3>
                  <p>
                    최근 활동과 꾸준함에 따라 Gitty는 행복해지기도
                    하고, 집사를 기다리기도 해요.
                  </p>
                </div>
              <div className="mood-visual" aria-hidden="true">
                <Image
                  src="/cats/angry.png"
                  alt="angry Gitty"
                  width={208}
                  height={208}
                />
                <Image
                  src="/cats/proud.png"
                  alt="proud Gitty"
                  width={208}
                  height={208}
                />
                <Image
                  src="/cats/love.png"
                  alt="love Gitty"
                  width={208}
                  height={208}
                />
              </div>
              </article>

              <article
                className="story-step"
                ref={(step) => {
                  storyStepRefs.current[2] = step;
                }}
              >
                <div className="story-copy">
                  <span className="step-number">03</span>
                  <h3>README에서 Gitty를 키워보세요</h3>
                  <p>
                    Gitty 위젯을 README에 추가하고, GitHub 활동에 따라
                    달라지는 모습을 지켜보세요.
                  </p>
                </div>
              <div className="readme-visual" aria-hidden="true">
                <div className="readme-toolbar">
                  <i />
                  <i />
                  <i />
                  <span>README.md</span>
                </div>
                <div className="readme-widget">
                  <Image
                    src="/cats/cheering.png"
                    alt=""
                    width={72}
                    height={72}
                  />
                  <div>
                    <span>Gitty</span>
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              </article>
            </div>
          </div>
        </section>

        <section className="meet-section" ref={meetSectionRef}>
          <div className="meet-sticky">
            <div className="meet-layout">
              <div
                className="section-heading meet-copy section-reveal"
                data-section-reveal
              >
                <p className="eyebrow">MEET GITTY</p>
                <h2>
                  툴툴대고 까칠한 녀석,
                  <br />
                  알고 보면 누구보다 집사바라기
                </h2>
              </div>
              <div className="mood-columns">
                <div className="mood-column">
                  <div className="mood-track hunger-track" ref={hungerTrackRef}>
                    {HUNGER_MARQUEE_STATES.map((state) => (
                      <Image
                        key={state}
                        src={`/cats/${state}.png`}
                        alt={`${state} Gitty`}
                        width={260}
                        height={260}
                      />
                    ))}
                  </div>
                </div>
                <div className="mood-column">
                  <div
                    className="mood-track positive-track"
                    ref={positiveTrackRef}
                  >
                    {POSITIVE_MARQUEE_STATES.map((state) => (
                      <Image
                        key={state}
                        src={`/cats/${state}.png`}
                        alt={`${state} Gitty`}
                        width={260}
                        height={260}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="final-section">
          <FinalGrassCanvas />
          <div className="final-content">
            <div
              className="final-copy section-reveal"
              data-section-reveal
            >
              <div className="final-heading">
                <h2>이제, Gitty의 집사가 되어보세요.</h2>
                <p>Gitty와 함께 GitHub 활동을 꾸준히 이어가 보세요.</p>
              </div>
              <a
                className="primary-action"
                href={GITHUB_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon />
                GitHub에서 Gitty 보기
              </a>
            </div>
          </div>
          <footer className="site-footer">
            <span>
              Made by{" "}
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
              >
                @ds92ko
              </a>
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}
