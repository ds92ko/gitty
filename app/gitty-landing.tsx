"use client";

import Image from "next/image";
import {
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
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

const FINAL_GRASS_LEVELS = Array.from({ length: 512 }, (_, index) => {
  const column = index % 32;
  const row = Math.floor(index / 32);
  const value = (index * 37 + column * 11 + row * 17 + index * index) % 100;

  if (value < 36) return 0;
  if (value < 57) return 1;
  if (value < 75) return 2;
  if (value < 91) return 3;
  return 4;
});

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

interface UsernameFormProps {
  id: string;
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
}

function UsernameForm({
  id,
  username,
  onUsernameChange,
  onSubmit,
  error,
}: UsernameFormProps) {
  return (
    <div className="username-block">
      <form className="username-form" onSubmit={onSubmit}>
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
        />
        <button type="submit">
          만나기
        </button>
      </form>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
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
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalPointerFrame = useRef<number | null>(null);
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
      if (finalPointerFrame.current !== null) {
        cancelAnimationFrame(finalPointerFrame.current);
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

    if (!section || !hungerTrack || !positiveTrack) {
      return;
    }

    const sectionElement = section;
    const hungerTrackElement = hungerTrack;
    const positiveTrackElement = positiveTrack;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileLayoutQuery = window.matchMedia("(max-width: 640px)");
    let frameId: number | null = null;

    function resetTracks() {
      hungerTrackElement.style.removeProperty("transform");
      positiveTrackElement.style.removeProperty("transform");
    }

    function drawTracks() {
      frameId = null;

      if (reducedMotionQuery.matches) {
        resetTracks();
        return;
      }

      const scrollDistance = Math.max(
        sectionElement.offsetHeight - window.innerHeight * 2,
        1,
      );
      const progress = Math.min(
        1,
        Math.max(
          0,
          -sectionElement.getBoundingClientRect().top / scrollDistance,
        ),
      );

      if (mobileLayoutQuery.matches) {
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

        hungerTrackElement.style.transform = `translate3d(${-hungerTravel * progress}px, 0, 0)`;
        positiveTrackElement.style.transform = `translate3d(${-positiveTravel * (1 - progress)}px, 0, 0)`;
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

      hungerTrackElement.style.transform = `translate3d(0, ${-hungerTravel * progress}px, 0)`;
      positiveTrackElement.style.transform = `translate3d(0, ${-positiveTravel * (1 - progress)}px, 0)`;
    }

    function updateTracks() {
      if (frameId === null) {
        frameId = requestAnimationFrame(drawTracks);
      }
    }

    window.addEventListener("scroll", updateTracks, { passive: true });
    window.addEventListener("resize", updateTracks);
    reducedMotionQuery.addEventListener("change", updateTracks);
    mobileLayoutQuery.addEventListener("change", updateTracks);
    updateTracks();

    return () => {
      window.removeEventListener("scroll", updateTracks);
      window.removeEventListener("resize", updateTracks);
      reducedMotionQuery.removeEventListener("change", updateTracks);
      mobileLayoutQuery.removeEventListener("change", updateTracks);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      resetTracks();
    };
  }, []);

  useEffect(() => {
    const section = worksSectionRef.current;
    const steps = storyStepRefs.current.filter(
      (step): step is HTMLElement => step !== null,
    );

    if (!section || steps.length === 0) {
      return;
    }

    const sectionElement = section;
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
      if (staticLayoutQuery.matches) {
        resetSteps();
        return;
      }

      const sectionTop = sectionElement.getBoundingClientRect().top;
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
    };
  }, []);

  const widgetUrl = activeUsername
    ? `${WIDGET_ORIGIN}/api/widget?username=${encodeURIComponent(activeUsername)}`
    : null;
  const markdown = widgetUrl ? `![Gitty](${widgetUrl})` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim();

    if (!GITHUB_USERNAME_PATTERN.test(normalizedUsername)) {
      setError("올바른 GitHub username을 입력해 주세요.");
      return;
    }

    setUsername(normalizedUsername);
    setActiveUsername(normalizedUsername);
    setError(null);
    setCopied(false);
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

  function handleFinalPointerMove(
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.pointerType !== "mouse") {
      return;
    }

    const section = event.currentTarget;
    const pointerX = event.clientX;
    const pointerY = event.clientY;

    if (finalPointerFrame.current !== null) {
      cancelAnimationFrame(finalPointerFrame.current);
    }

    finalPointerFrame.current = requestAnimationFrame(() => {
      finalPointerFrame.current = null;
      const grid = section.querySelector<HTMLElement>(".final-grass");

      if (!grid) {
        return;
      }

      const gridRect = grid.getBoundingClientRect();
      const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
      const cellWidth = (gridRect.width - gap * 31) / 32;
      const cellHeight = (gridRect.height - gap * 15) / 16;
      const radius = 210;

      grid.querySelectorAll<HTMLElement>(".grass-cell").forEach(
        (cell, index) => {
          const column = index % 32;
          const row = Math.floor(index / 32);
          const cellX =
            gridRect.left + column * (cellWidth + gap) + cellWidth / 2;
          const cellY =
            gridRect.top + row * (cellHeight + gap) + cellHeight / 2;
          const distance = Math.hypot(pointerX - cellX, pointerY - cellY);
          const strength = Math.max(0, 1 - distance / radius);

          cell.style.setProperty(
            "--cell-highlight",
            `${Math.round(strength * 86)}%`,
          );
        },
      );
    });
  }

  function handleFinalPointerLeave(
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.pointerType !== "mouse") {
      return;
    }

    if (finalPointerFrame.current !== null) {
      cancelAnimationFrame(finalPointerFrame.current);
      finalPointerFrame.current = null;
    }

    event.currentTarget
      .querySelectorAll<HTMLElement>(".grass-cell")
      .forEach((cell) => cell.style.setProperty("--cell-highlight", "0%"));
  }

  return (
    <div className="landing-shell">
      <header className="site-header">
        <Image
          src="/brand/logo.png"
          alt="Gitty"
          width={112}
          height={35}
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
        <section className="hero-section">
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
            onUsernameChange={setUsername}
            onSubmit={handleSubmit}
            error={error}
          />

          <div className="hero-stage" aria-live="polite">
            {widgetUrl ? (
              <div className="widget-result">
                <Image
                  key={widgetUrl}
                  className="widget-preview"
                  src={`/api/widget?username=${encodeURIComponent(activeUsername ?? "")}`}
                  alt={`${activeUsername}의 Gitty 위젯`}
                  width={614}
                  height={274}
                  unoptimized
                />
                <div className="markdown-area">
                  <span>README에 추가하기</span>
                  <div className="markdown-copy">
                    <code>{markdown}</code>
                    <button type="button" onClick={copyMarkdown}>
                      {copied ? "복사됨 ✓" : "복사"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="initial-gitty" ref={initialGittyRef}>
                <div className="initial-pet-scene">
                  <Image
                    className="idle-gitty"
                    src="/cats/waiting.png"
                    alt="집사를 기다리는 Gitty"
                    width={300}
                    height={300}
                    priority
                  />
                  <Image
                    className="hero-bowl"
                    src="/activity/bowl_empty.png"
                    alt="빈 밥그릇"
                    width={78}
                    height={54}
                  />
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
          <div className="works-sticky">
            <div className="section-heading">
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
                  <i />
                </div>
                <Image
                  src="/activity/bowl_full.png"
                  alt=""
                  width={92}
                  height={64}
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
              <div className="mood-visual">
                <Image
                  src="/cats/waiting.png"
                  alt="waiting Gitty"
                  width={120}
                  height={120}
                />
                <Image
                  src="/cats/happy.png"
                  alt="happy Gitty"
                  width={132}
                  height={132}
                />
                <Image
                  src="/cats/love.png"
                  alt="love Gitty"
                  width={120}
                  height={120}
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
                    src="/cats/happy.png"
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
              <div className="section-heading meet-copy">
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

        <section
          className="final-section"
          onPointerMove={handleFinalPointerMove}
          onPointerLeave={handleFinalPointerLeave}
        >
          <div className="final-grass" aria-hidden="true">
            {FINAL_GRASS_LEVELS.map((level, index) => (
              <i className={`grass-cell grass-level-${level}`} key={index} />
            ))}
          </div>
          <div className="final-content">
            <p className="eyebrow">START TOGETHER</p>
            <h2>이제, Gitty의 집사가 되어보세요.</h2>
            <p>Gitty와 함께 GitHub 활동을 꾸준히 이어가 보세요.</p>
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
