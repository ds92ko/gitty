"use client";

import { CAT_STATE_MESSAGES } from "@/lib/gitty/cat-message";
import Image from "next/image";
import {
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

const POSITIVE_STATES = [
  "normal",
  "coding",
  "happy",
  "cheering",
  "excited",
  "proud",
  "love",
] as const;

const HUNGER_STATES = [
  "waiting",
  "nervous",
  "crying",
  "angry",
  "tired",
  "burned_out",
  "sleeping",
] as const;

type MoodState =
  | (typeof POSITIVE_STATES)[number]
  | (typeof HUNGER_STATES)[number];

function addTrackSentinels<T extends MoodState>(states: readonly T[]) {
  const first = states[0];
  const last = states.at(-1);

  return first && last ? [last, ...states, first] : [];
}

const POSITIVE_TRACK_STATES = addTrackSentinels(
  [...POSITIVE_STATES].reverse(),
);
const HUNGER_TRACK_STATES = addTrackSentinels(HUNGER_STATES);

interface MoodTrackProps {
  className: string;
  states: readonly MoodState[];
  trackRef: RefObject<HTMLDivElement | null>;
  onPointerEnter: (
    event: ReactPointerEvent<HTMLImageElement>,
    state: MoodState,
  ) => void;
  onPointerMove: PointerEventHandler<HTMLImageElement>;
  onPointerLeave: PointerEventHandler<HTMLImageElement>;
}

function MoodTrack({
  className,
  states,
  trackRef,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
}: MoodTrackProps) {
  return (
    <div className="mood-column">
      <div className={`mood-track ${className}`} ref={trackRef}>
        {states.map((state, index) => {
          const isSentinel =
            index === 0 || index === states.length - 1;

          return (
            <Image
              key={`${state}-${index}`}
              src={`/cats/${state}.png`}
              alt={isSentinel ? "" : `${state} Gitty`}
              data-mood-state={state}
              data-mood-sentinel={isSentinel ? "" : undefined}
              width={260}
              height={260}
              onPointerEnter={(event) => onPointerEnter(event, state)}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MeetSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const moodColumnsRef = useRef<HTMLDivElement>(null);
  const hungerTrackRef = useRef<HTMLDivElement>(null);
  const positiveTrackRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipFrameRef = useRef<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    state: MoodState;
    visible: boolean;
  }>({
    state: "normal",
    visible: false,
  });

  function positionTooltip(clientX: number, clientY: number) {
    const tooltipElement = tooltipRef.current;

    if (!tooltipElement) {
      return;
    }

    const bubble = tooltipElement.firstElementChild as HTMLElement | null;
    const bubbleWidth = bubble?.offsetWidth ?? 0;
    const bubbleHeight = bubble?.offsetHeight ?? 0;
    const gap = 16;
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, clientX - bubbleWidth / 2),
      window.innerWidth - bubbleWidth - viewportPadding,
    );
    const top = Math.max(
      viewportPadding,
      clientY - bubbleHeight - gap,
    );

    tooltipElement.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  function handlePointerEnter(
    event: ReactPointerEvent<HTMLImageElement>,
    state: MoodState,
  ) {
    if (event.pointerType !== "mouse") {
      return;
    }

    const { clientX, clientY } = event;
    setTooltip({ state, visible: true });

    if (tooltipFrameRef.current !== null) {
      cancelAnimationFrame(tooltipFrameRef.current);
    }

    tooltipFrameRef.current = requestAnimationFrame(() => {
      positionTooltip(clientX, clientY);
      tooltipFrameRef.current = null;
    });
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLImageElement>,
  ) {
    if (event.pointerType === "mouse") {
      positionTooltip(event.clientX, event.clientY);
    }
  }

  function handlePointerLeave(
    event: ReactPointerEvent<HTMLImageElement>,
  ) {
    if (event.pointerType === "mouse") {
      setTooltip((current) => ({ ...current, visible: false }));
    }
  }

  useEffect(() => {
    return () => {
      if (tooltipFrameRef.current !== null) {
        cancelAnimationFrame(tooltipFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const moodColumns = moodColumnsRef.current;
    const hungerTrack = hungerTrackRef.current;
    const positiveTrack = positiveTrackRef.current;

    if (!section || !hungerTrack || !positiveTrack || !moodColumns) {
      return;
    }

    const sectionElement: HTMLElement = section;
    const moodColumnsElement: HTMLDivElement = moodColumns;
    const hungerTrackElement: HTMLDivElement = hungerTrack;
    const positiveTrackElement: HTMLDivElement = positiveTrack;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const horizontalLayoutQuery = window.matchMedia("(max-width: 900px)");
    let frameId: number | null = null;
    let trackStep = 0;
    let trackInset = 0;

    function isHorizontalLayout() {
      return horizontalLayoutQuery.matches;
    }

    function getViewport(track: HTMLElement) {
      return track.parentElement;
    }

    function getViewportSize(track: HTMLElement) {
      const viewport = getViewport(track);

      if (!viewport) {
        return 0;
      }

      return isHorizontalLayout()
        ? viewport.clientWidth
        : viewport.clientHeight;
    }

    function getTrackSize(track: HTMLElement) {
      return isHorizontalLayout()
        ? track.scrollWidth
        : track.scrollHeight;
    }

    function setTrackPosition(track: HTMLElement, position: number) {
      track.style.transform = isHorizontalLayout()
        ? `translate3d(${position}px, 0, 0)`
        : `translate3d(0, ${position}px, 0)`;
    }

    function resetTracks() {
      hungerTrackElement.style.removeProperty("transform");
      positiveTrackElement.style.removeProperty("transform");
    }

    function updateTracks() {
      if (frameId === null) {
        frameId = requestAnimationFrame(drawTracks);
      }
    }

    function measureTracks() {
      const firstItem =
        positiveTrackElement.firstElementChild as HTMLElement | null;
      const viewport = getViewport(positiveTrackElement);

      if (!firstItem || !viewport) {
        trackStep = 0;
        return;
      }

      const trackStyles = getComputedStyle(positiveTrackElement);
      const viewportStyles = getComputedStyle(viewport);
      const gap = Number.parseFloat(trackStyles.gap) || 0;
      const itemSize = isHorizontalLayout()
        ? firstItem.offsetWidth
        : firstItem.offsetHeight;
      const maskFadePercent =
        Number.parseFloat(
          viewportStyles.getPropertyValue("--mood-mask-fade"),
        ) || 0;
      const edgeBuffer =
        Number.parseFloat(
          viewportStyles.getPropertyValue("--mood-edge-buffer"),
        ) || 0;

      trackStep = itemSize + gap;
      trackInset =
        Math.ceil(
          (getViewportSize(positiveTrackElement) * maskFadePercent) /
            100,
        ) +
        edgeBuffer;
      updateTracks();
    }

    function getHalfStepCorrection(relativePosition: number) {
      if (!trackStep) {
        return 0;
      }

      const currentPhase =
        ((relativePosition % trackStep) + trackStep) % trackStep;
      return trackStep / 2 - currentPhase;
    }

    function getPositivePosition(
      hungerTravel: number,
      positiveTravel: number,
      progress: number,
    ) {
      const start =
        trackInset -
        trackStep -
        positiveTravel +
        getHalfStepCorrection(-positiveTravel);
      const end =
        trackInset -
        trackStep +
        getHalfStepCorrection(hungerTravel);

      return start + (end - start) * progress;
    }

    function getTravel(track: HTMLElement) {
      return Math.max(
        getTrackSize(track) -
          trackStep * 2 -
          getViewportSize(track) +
          trackInset * 2,
        0,
      );
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

      const scrollBeforeFinalSection = Math.max(
        sectionElement.offsetHeight - window.innerHeight * 2,
        0,
      );
      const scrollOffset = Math.min(
        scrollBeforeFinalSection,
        Math.max(0, -sectionTop),
      );
      const progress = scrollBeforeFinalSection
        ? scrollOffset / scrollBeforeFinalSection
        : 0;
      const hungerTravel = getTravel(hungerTrackElement);
      const positiveTravel = getTravel(positiveTrackElement);

      setTrackPosition(
        hungerTrackElement,
        trackInset - trackStep - hungerTravel * progress,
      );
      setTrackPosition(
        positiveTrackElement,
        getPositivePosition(hungerTravel, positiveTravel, progress),
      );
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

  return (
    <>
      <section className="meet-section" ref={sectionRef}>
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
            <div className="mood-columns" ref={moodColumnsRef}>
              <MoodTrack
                className="hunger-track"
                states={HUNGER_TRACK_STATES}
                trackRef={hungerTrackRef}
                onPointerEnter={handlePointerEnter}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              />
              <MoodTrack
                className="positive-track"
                states={POSITIVE_TRACK_STATES}
                trackRef={positiveTrackRef}
                onPointerEnter={handlePointerEnter}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mood-tooltip" ref={tooltipRef} aria-hidden="true">
        <span
          className={`mood-tooltip-bubble${tooltip.visible ? " is-visible" : ""}`}
        >
          {CAT_STATE_MESSAGES[tooltip.state]}
        </span>
      </div>
    </>
  );
}
