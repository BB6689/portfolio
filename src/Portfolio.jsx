import { useState, useEffect, useRef } from "react";

/* ─── Web3Forms — get your free key at web3forms.com ─── */
const WEB3FORMS_KEY = "158978e4-fcb4-430a-a444-37262c5aaace";

/* ─── GitHub SVG (same as original) ─── */
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "currentColor" }}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

/* ─── Reveal hook — fires IntersectionObserver ─── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Pointer-follow 3D tilt + specular (common “premium card” pattern; lerp-smoothed rAF) */
function setupPointerTilts() {
  if (!window.matchMedia("(pointer:fine)").matches) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const els = [...document.querySelectorAll("[data-tilt]")];
  const cleanups = els.map(el => {
    const maxDeg = Number.parseFloat(el.getAttribute("data-tilt-max") || "11");
    const scale = Number.parseFloat(el.getAttribute("data-tilt-scale") || "1.035");
    const ease = Number.parseFloat(el.getAttribute("data-tilt-ease") || "0.16");
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;

    const tick = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      const rx = -cy * maxDeg;
      const ry = cx * maxDeg;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${scale},${scale},${scale})`;
      el.style.setProperty("--gx", `${50 + cx * 48}%`);
      el.style.setProperty("--gy", `${50 + cy * 48}%`);
      el.style.setProperty("--tilt-glare", String(Math.min(0.65, Math.hypot(cx, cy) * 0.5)));

      const settled = Math.abs(tx - cx) < 0.003 && Math.abs(ty - cy) < 0.003;
      if (settled && Math.abs(tx) < 1e-6 && Math.abs(ty) < 1e-6) {
        el.style.transform = "";
        el.style.removeProperty("--gx");
        el.style.removeProperty("--gy");
        el.style.setProperty("--tilt-glare", "0");
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = e => {
      if (el.classList.contains("portrait-frame") && window.innerWidth <= 900) {
        tx = 0;
        ty = 0;
        if (!raf) raf = requestAnimationFrame(tick);
        return;
      }
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
      el.style.removeProperty("--gx");
      el.style.removeProperty("--gy");
      el.style.setProperty("--tilt-glare", "0");
    };
  });

  return () => cleanups.forEach(fn => fn());
}

/* ─── Global styles injected once ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

:root {
  --black:#0a0a0a; --dark:#111111; --card:#181818; --border:#282828;
  --orange:#ff6200; --orange2:#ff8c38; --muted:#888888;
  --light:#f0f0f0; --white:#ffffff;
  --font-head:'Bebas Neue',sans-serif; --font-body:'DM Sans',sans-serif;
  --radius:4px; --transition:.35s cubic-bezier(.4,0,.2,1);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);background:var(--black);color:var(--light);font-size:16px;line-height:1.65;overflow-x:hidden}
a{text-decoration:none;color:inherit}
img{max-width:100%;display:block}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--dark)}
::-webkit-scrollbar-thumb{background:var(--orange);border-radius:2px}

/* Reveal — opacity only so [data-tilt] can own transform */
.reveal{opacity:0;filter:blur(6px);transition:opacity .75s ease,filter .75s ease}
.reveal.visible{opacity:1;filter:blur(0)}

/* Progress bar */
#progress-bar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--orange),var(--orange2));width:0%;z-index:9999;transition:width .1s}

/* Cursor */
@media(pointer:fine){
  .cursor{width:12px;height:12px;background:var(--orange);border-radius:50%;position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transition:transform .15s,opacity .3s;mix-blend-mode:exclusion}
  .cursor.big{transform:scale(4)}
}

/* Preloader */
#preloader{position:fixed;inset:0;background:var(--black);display:flex;align-items:center;justify-content:center;z-index:99999;transition:opacity .8s cubic-bezier(.4,0,.2,1),visibility .8s}
#preloader.hidden{opacity:0;visibility:hidden;pointer-events:none}
.pre-text{font-family:var(--font-head);font-size:clamp(3rem,10vw,8rem);color:var(--white);letter-spacing:.1em;animation:preAnim 1.8s cubic-bezier(.4,0,.2,1) forwards;will-change:transform,opacity,filter;transform:translateZ(0)}
.pre-text span{color:var(--orange)}
@keyframes preAnim{
  0%  {opacity:0;transform:translateY(28px);filter:blur(12px)}
  30% {opacity:1;transform:translateY(0);filter:blur(0)}
  72% {opacity:1;transform:translateY(0);filter:blur(0)}
  100%{opacity:0;transform:translateY(-16px);filter:blur(8px)}
}

/* Nav */
nav{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;height:70px;backdrop-filter:blur(12px);background:rgba(10,10,10,.85);border-bottom:1px solid var(--border);transition:height var(--transition)}
nav.scrolled{height:58px}
.nav-logo{font-family:var(--font-head);font-size:1.6rem;letter-spacing:.08em;color:var(--white)}
.nav-logo span{color:var(--orange)}
.nav-links{display:flex;gap:2rem}
.nav-links a{font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);position:relative;transition:color var(--transition)}
.nav-links a::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:var(--orange);transition:width var(--transition)}
.nav-links a:hover{color:var(--white)}
.nav-links a:hover::after{width:100%}
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;width:26px}
.hamburger span{display:block;height:2px;background:var(--white);transition:var(--transition)}
.hamburger.active span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.active span:nth-child(2){opacity:0}
.hamburger.active span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.mobile-menu{display:none;flex-direction:column;gap:1.5rem;position:fixed;top:70px;left:0;right:0;background:rgba(10,10,10,.97);padding:2rem 5vw;border-bottom:1px solid var(--border);z-index:999}
.mobile-menu.open{display:flex}
.mobile-menu a{font-family:var(--font-head);font-size:1.4rem;letter-spacing:.1em;color:var(--light);transition:color var(--transition)}
.mobile-menu a:hover{color:var(--orange)}

/* Shared */
section{padding:100px 5vw}
.section-label{font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;color:var(--orange);margin-bottom:1rem}
.section-title{font-family:var(--font-head);font-size:clamp(2rem,5vw,3.5rem);color:var(--white);line-height:1.05;letter-spacing:.04em;text-shadow:0 6px 32px rgba(0,0,0,.55),0 2px 0 rgba(255,255,255,.04);transform-style:preserve-3d}
.section-title .thin{font-family:var(--font-body);font-weight:300;color:var(--muted)}
.divider{width:60px;height:3px;background:linear-gradient(90deg,var(--orange),transparent);margin:1.2rem 0 2.5rem}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 2rem;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;border-radius:var(--radius);cursor:pointer;transition:var(--transition);border:none;font-family:var(--font-body)}
.btn-primary{background:var(--orange);color:var(--white)}
.btn-primary:hover{background:var(--orange2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,98,0,.35)}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--light)}
.btn-outline:hover{border-color:var(--orange);color:var(--orange);transform:translateY(-2px)}

/* Hero — portfolio_with_portrait / portfolio_output (full-width row + portrait) */
#hero{min-height:100vh;width:100%;display:flex;align-items:center;padding:120px 5vw 80px;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse 60% 60% at 80% 50%,rgba(255,98,0,.12) 0%,transparent 70%),radial-gradient(ellipse 40% 80% at 10% 30%,rgba(255,98,0,.06) 0%,transparent 60%)}
.hero-grid{position:absolute;inset:0;z-index:0;opacity:.06;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:48px 48px}
.hero-inner{position:relative;z-index:1;width:100%;max-width:100%;display:flex;align-items:center;justify-content:space-between;gap:clamp(2rem,4vw,5rem);box-sizing:border-box;transform-style:preserve-3d}
.hero-content{flex:1;min-width:0;max-width:none;transform-style:preserve-3d}
.hero-tag{display:inline-block;padding:.35rem 1rem;background:rgba(255,98,0,.15);border:1px solid rgba(255,98,0,.4);color:var(--orange2);font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;border-radius:2px;margin-bottom:1.5rem;animation:fadeUp .6s ease both}
.hero-name{font-family:var(--font-head);font-size:clamp(3.5rem,9vw,8.5rem);line-height:.95;color:var(--white);letter-spacing:.02em;animation:fadeUp .6s .15s ease both}
.hero-name .accent{color:var(--orange)}
.hero-role{font-size:clamp(.95rem,2vw,1.25rem);color:var(--muted);margin-top:1.5rem;font-weight:300;animation:fadeUp .6s .3s ease both}
.hero-role strong{color:var(--light);font-weight:500}
.hero-actions{display:flex;flex-wrap:wrap;gap:1rem;margin-top:2.5rem;animation:fadeUp .6s .45s ease both}
.hero-portrait-col{flex-shrink:0;display:flex;align-items:center;justify-content:center;animation:fadeUp .6s .3s ease both}
.portrait-frame{position:relative;width:340px;height:340px;display:flex;align-items:center;justify-content:center;perspective:900px;transform-style:preserve-3d}
.portrait-ring-outer{position:absolute;inset:-20px;border-radius:50%;border:1px dashed rgba(255,98,0,.25);animation:spinSlow 20s linear infinite}
.portrait-ring-inner{position:absolute;inset:-8px;border-radius:50%;border:2px solid transparent;background:linear-gradient(var(--black),var(--black)) padding-box,conic-gradient(from 0deg,var(--orange) 0%,rgba(255,98,0,.15) 40%,rgba(255,98,0,.05) 60%,var(--orange) 100%) border-box;animation:spinSlow 8s linear infinite reverse}
.portrait-glow-blob{position:absolute;inset:-30px;border-radius:50%;background:radial-gradient(circle,rgba(255,98,0,.22) 0%,rgba(255,98,0,.08) 45%,transparent 70%);animation:glowPulse 3.5s ease-in-out infinite;z-index:0}
.portrait-img-wrap{position:relative;z-index:1;width:300px;height:300px;border-radius:50%;overflow:hidden;border:3px solid var(--orange);box-shadow:0 0 0 6px rgba(255,98,0,.08),0 0 40px rgba(255,98,0,.25),0 20px 60px rgba(0,0,0,.7),inset 0 0 30px rgba(0,0,0,.3);animation:heroFloat 5s ease-in-out infinite;transition:box-shadow .4s ease,transform .4s ease;transform-style:preserve-3d}
.portrait-img-wrap:hover{box-shadow:0 0 0 8px rgba(255,98,0,.15),0 0 60px rgba(255,98,0,.4),0 24px 70px rgba(0,0,0,.8),inset 0 0 30px rgba(0,0,0,.3);animation-play-state:paused}
.portrait-img{width:100%;height:100%;object-fit:cover;object-position:center 61%;display:block}@keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

/* Pointer-driven 3D tilt + specular (VanillaTilt-style; JS sets transform + --gx/--gy/--tilt-glare) */
@media(pointer:fine){
  [data-tilt]{position:relative;transform-style:preserve-3d;backface-visibility:hidden;-webkit-font-smoothing:antialiased}
  [data-tilt]:not(.exp-card):not(.portrait-frame)::before{
    content:"";
    position:absolute;
    inset:0;
    border-radius:inherit;
    z-index:1;
    pointer-events:none;
    opacity:var(--tilt-glare,0);
    mix-blend-mode:soft-light;
    background:radial-gradient(520px circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.28) 0%,rgba(255,140,56,.1) 28%,transparent 56%);
    transition:opacity .1s linear;
  }
  /* Portrait: clip glare to the circle shape (inset matches portrait-img-wrap size inside the frame) */
  .portrait-frame[data-tilt]::before{
    content:"";
    position:absolute;
    inset:20px;
    border-radius:50%;
    z-index:2;
    pointer-events:none;
    opacity:var(--tilt-glare,0);
    mix-blend-mode:soft-light;
    background:radial-gradient(400px circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.28) 0%,rgba(255,140,56,.1) 28%,transparent 56%);
    transition:opacity .1s linear;
  }
  [data-tilt] > *{position:relative;z-index:3}
  .project-card::after{
    background:linear-gradient(135deg,rgba(255,98,0,.06) 0%,transparent 55%),
      radial-gradient(460px circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.12),transparent 52%);
    z-index:0;
  }
}

/* About */
#about{background:var(--dark)}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:start}
.about-text{color:#bbb;font-weight:300;line-height:1.8}
.about-text p{margin-bottom:1rem}
.about-text strong{color:var(--white);font-weight:500}
.education-card{background:var(--card);border:1px solid var(--border);border-left:3px solid var(--orange);padding:1.8rem;border-radius:var(--radius);transition:border-color .35s ease,box-shadow .35s ease;transform-style:preserve-3d}
.education-card:hover{border-color:rgba(255,98,0,.35);box-shadow:0 22px 48px rgba(0,0,0,.28)}
.education-card h4{font-family:var(--font-head);font-size:1.3rem;color:var(--white);letter-spacing:.06em}
.education-card .inst{color:var(--orange2);font-size:.85rem;margin:.4rem 0}
.education-card .meta{color:var(--muted);font-size:.8rem}
.coursework-label{margin-top:1.5rem;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);margin-bottom:.6rem}
.coursework-tags{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
.tag{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;background:var(--border);color:var(--muted);padding:.3rem .7rem;border-radius:2px;transition:var(--transition)}
.tag:hover{background:rgba(255,98,0,.2);color:var(--orange)}

/* Experience */
#experience{background:var(--black)}
.exp-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem 2rem 2rem 2.5rem;position:relative;overflow:hidden;transition:border-color var(--transition),box-shadow .35s ease;transform-style:preserve-3d}
.exp-card:hover{border-color:rgba(255,98,0,.3);box-shadow:0 22px 44px rgba(0,0,0,.26)}
.exp-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--orange),transparent)}
.exp-header{display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
.exp-role{font-family:var(--font-head);font-size:1.6rem;color:var(--white);letter-spacing:.06em}
.exp-company{color:var(--orange2);font-size:.9rem;margin-top:.25rem}
.exp-badge{align-self:flex-start;background:rgba(255,98,0,.15);border:1px solid rgba(255,98,0,.35);color:var(--orange);padding:.4rem 1rem;font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;border-radius:2px;white-space:nowrap}
.exp-list{display:flex;flex-direction:column;gap:.75rem}
.exp-item{display:flex;gap:1rem;align-items:baseline;font-size:.9rem;color:#bbb;line-height:1.5}
.exp-bullet{color:var(--orange);font-size:1rem;flex-shrink:0}
.exp-highlight{color:var(--orange2);font-weight:600}

/* Projects */
#projects{background:var(--dark)}
.projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
.project-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;position:relative;overflow:hidden;transition:border-color var(--transition),box-shadow var(--transition);display:flex;flex-direction:column;cursor:pointer;transform-style:preserve-3d}
.project-card:hover{border-color:rgba(255,98,0,.45);box-shadow:0 20px 48px rgba(255,98,0,.1),0 12px 36px rgba(0,0,0,.3)}
.project-card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,98,0,.04) 0%,transparent 60%);pointer-events:none}
.project-num{font-family:var(--font-head);font-size:3rem;color:rgba(255,98,0,.12);line-height:1;position:absolute;right:1.2rem;top:.8rem;letter-spacing:.05em}
.project-icon-wrap{width:64px;height:64px;margin-bottom:1rem;border-radius:var(--radius);overflow:hidden;background:rgba(255,98,0,.1);border:1px solid rgba(255,98,0,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.project-icon-wrap img{width:100%;height:100%;object-fit:cover}
.project-title{font-family:var(--font-head);font-size:1.2rem;color:var(--white);letter-spacing:.06em;margin-bottom:.75rem}
.project-desc{font-size:.88rem;color:#aaa;line-height:1.65;flex:1}
.project-footer{margin-top:1.2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem}
.project-award{display:inline-flex;align-items:center;gap:.4rem;background:rgba(255,98,0,.15);border:1px solid rgba(255,98,0,.3);color:var(--orange2);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;padding:.3rem .8rem;border-radius:2px}
.project-metrics{display:flex;flex-wrap:wrap;gap:.5rem}
.metric{font-size:.75rem;background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--muted);padding:.25rem .65rem;border-radius:2px}
.project-link-btn{display:inline-flex;align-items:center;gap:.4rem;background:rgba(255,98,0,.15);border:1px solid rgba(255,98,0,.35);color:var(--orange2);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:.4rem 1rem;border-radius:2px;transition:background var(--transition),color var(--transition),border-color var(--transition);position:relative;z-index:2}
.project-link-btn:hover{background:var(--orange);color:var(--white);border-color:var(--orange)}

/* Skills */
#skills{background:var(--black)}
.skills-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem}
.skill-category{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;transition:border-color var(--transition),box-shadow .35s ease;transform-style:preserve-3d}
.skill-category:hover{border-color:rgba(255,98,0,.35);box-shadow:0 22px 48px rgba(0,0,0,.28)}
.skill-cat-title{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--orange);margin-bottom:1rem;display:flex;align-items:center;gap:.6rem}
.skill-cat-title::after{content:'';flex:1;height:1px;background:var(--border)}
.skill-tags{display:flex;flex-wrap:wrap;gap:.5rem}
.skill-tag{font-size:.8rem;color:var(--light);background:rgba(255,255,255,.05);border:1px solid var(--border);padding:.35rem .85rem;border-radius:2px;transition:var(--transition)}
.skill-tag:hover{background:rgba(255,98,0,.2);border-color:rgba(255,98,0,.4);color:var(--orange)}

/* Certifications */
#certifications{background:var(--dark)}
.certs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.2rem}
.cert-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;display:flex;align-items:center;gap:1rem;transition:border-color var(--transition),box-shadow .35s ease;cursor:pointer;transform-style:preserve-3d}
.cert-card:hover{border-color:rgba(255,98,0,.45);box-shadow:0 16px 40px rgba(255,98,0,.1)}
.cert-icon-wrap{width:52px;height:52px;flex-shrink:0;background:rgba(255,98,0,.08);border:1px solid rgba(255,98,0,.3);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:6px}
.cert-icon-wrap img{width:100%;height:100%;object-fit:contain;object-position:center}
.cert-info{flex:1}
.cert-name{font-size:.9rem;color:var(--white);font-weight:500}
.cert-org{font-size:.75rem;color:var(--orange2);margin-top:.2rem}
.cert-view{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--orange);margin-top:.45rem;opacity:0;transition:opacity var(--transition)}
.cert-card:hover .cert-view{opacity:1}

/* Awards */
#awards{background:var(--black)}
.awards-row{display:flex;flex-wrap:wrap;gap:1.5rem}
.award-card{flex:1;min-width:260px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;position:relative;overflow:hidden;transition:border-color var(--transition),box-shadow .35s ease;transform-style:preserve-3d}
.award-card:hover{border-color:rgba(255,98,0,.4);box-shadow:0 24px 48px rgba(0,0,0,.26)}
.award-medal{font-size:2.5rem;margin-bottom:1rem}
.award-title{font-family:var(--font-head);font-size:1.3rem;color:var(--white);letter-spacing:.06em}
.award-desc{font-size:.88rem;color:#aaa;margin-top:.5rem}
.award-glow{position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(255,98,0,.15) 0%,transparent 70%);border-radius:50%;z-index:0;pointer-events:none}

/* Contact */
#contact{background:var(--dark)}
.contact-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:4rem;align-items:start}
.contact-form-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;display:flex;flex-direction:column;gap:1.5rem;transition:border-color .35s ease,box-shadow .35s ease;transform-style:preserve-3d}
.contact-form-card:hover{border-color:rgba(255,98,0,.25);box-shadow:0 22px 44px rgba(0,0,0,.26)}
.contact-form-card h3{font-family:var(--font-head);font-size:1.8rem;color:var(--white);letter-spacing:.06em;margin-bottom:.5rem}
.contact-form-card p{color:#aaa;line-height:1.8}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.form-row .full-width{grid-column:1/-1}
.form-field{display:flex;flex-direction:column;gap:.5rem}
.form-field span{font-size:.82rem;color:#aaa}
.form-field input,.form-field textarea{width:100%;background:rgba(255,255,255,.03);color:var(--light);border:1px solid var(--border);border-radius:var(--radius);padding:.95rem 1rem;font-size:.95rem;transition:border-color var(--transition),box-shadow var(--transition);font-family:var(--font-body)}
.form-field input:focus,.form-field textarea:focus{outline:none;border-color:var(--orange);box-shadow:0 0 0 3px rgba(255,98,0,.12)}
.form-field textarea{resize:vertical;min-height:120px}
.btn-submit{margin-top:1rem;width:max-content}
.form-success{color:var(--orange);font-size:.92rem;min-height:1.3rem}
.form-error{color:#ff4444;font-size:.92rem;min-height:1.3rem}
.contact-sidebar{display:flex;flex-direction:column;gap:1.5rem}
.contact-info{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;display:flex;flex-direction:column;gap:1.2rem}
.contact-item{display:flex;align-items:center;gap:1rem;background:transparent;border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.5rem;transition:border-color var(--transition)}
.contact-item:hover{border-color:rgba(255,98,0,.4)}
.contact-item-icon{width:40px;height:40px;flex-shrink:0;background:rgba(255,98,0,.15);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:1rem}
.contact-item-text .label{font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
.contact-item-text .value{color:var(--light);font-size:.92rem;margin-top:.15rem}
.contact-item-text a{color:var(--orange2);transition:color var(--transition)}
.contact-item-text a:hover{color:var(--orange)}
.reloc-section{margin-top:1.5rem}
.reloc-title{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--orange);margin-bottom:.75rem}
.reloc-tags{display:flex;flex-wrap:wrap;gap:.5rem}
.reloc-tag{font-size:.78rem;background:rgba(255,98,0,.1);border:1px solid rgba(255,98,0,.25);color:var(--orange2);padding:.3rem .75rem;border-radius:2px}
.contact-cta{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2.5rem;transition:border-color .35s ease,box-shadow .35s ease;transform-style:preserve-3d}
.contact-cta:hover{border-color:rgba(255,98,0,.3);box-shadow:0 24px 48px rgba(0,0,0,.26)}
.contact-cta h3{font-family:var(--font-head);font-size:1.8rem;color:var(--white);letter-spacing:.06em;margin-bottom:.75rem}
.contact-cta p{color:#aaa;font-size:.9rem;line-height:1.7;margin-bottom:2rem}
.cta-links{display:flex;flex-direction:column;gap:.8rem}
.cta-link{display:flex;align-items:center;justify-content:space-between;padding:.9rem 1.2rem;border:1px solid var(--border);border-radius:var(--radius);color:var(--light);font-size:.85rem;transition:border-color var(--transition),background var(--transition),color var(--transition)}
.cta-link:hover{border-color:var(--orange);background:rgba(255,98,0,.08);color:var(--orange)}

@media(prefers-reduced-motion:reduce){
  [data-tilt]::before{opacity:0!important;display:none}
  .portrait-img-wrap,.portrait-ring-outer,.portrait-ring-inner,.portrait-glow-blob{animation:none!important}
  .portrait-img-wrap:hover{transform:none;animation:none}
}

/* Footer */
footer{background:var(--black);border-top:1px solid var(--border);padding:2.5rem 5vw;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
.footer-logo{font-family:var(--font-head);font-size:1.4rem;color:var(--white);letter-spacing:.08em}
.footer-logo span{color:var(--orange)}
.footer-copy{font-size:.78rem;color:var(--muted)}
.footer-back{font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);border-bottom:1px solid rgba(255,98,0,.3);transition:color var(--transition)}
.footer-back:hover{color:var(--white)}

/* Responsive */
@media(min-width:1400px){
  .portrait-frame{width:380px;height:380px}
  .portrait-img-wrap{width:336px;height:336px}
  .portrait-ring-outer{inset:-22px}
  .portrait-ring-inner{inset:-9px}
  .portrait-glow-blob{inset:-34px}
}
@media(max-width:1100px){
  .portrait-frame{width:280px;height:280px}
  .portrait-img-wrap{width:248px;height:248px}
}
@media(max-width:900px){
  .about-grid,.contact-grid{grid-template-columns:1fr;gap:2.5rem}
  .nav-links{display:none}
  .hamburger{display:flex}
  .hero-inner{flex-direction:column-reverse;align-items:center;text-align:center;gap:2.5rem;padding-top:2rem}
  .hero-content{max-width:100%}
  .hero-actions{justify-content:center}
  .portrait-frame{width:240px;height:240px}
  .portrait-img-wrap{width:212px;height:212px}
  .portrait-ring-outer{inset:-16px}
  .portrait-ring-inner{inset:-6px}
  .portrait-glow-blob{inset:-24px}
}
@media(max-width:600px){
  section{padding:70px 5vw}
  .exp-header{flex-direction:column}
  .projects-grid{grid-template-columns:1fr}
  .certs-grid{grid-template-columns:1fr}
  .portrait-frame{width:200px;height:200px}
  .portrait-img-wrap{width:176px;height:176px}
  .hero-name{font-size:clamp(3rem,15vw,5rem)}
}
`;

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formMsg, setFormMsg] = useState({ text: "", type: "" });
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const progressRef = useRef(null);
  const navRef = useRef(null);
  const cursorRef = useRef(null);

  useReveal();

  /* inject CSS once */
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);


  /* preloader */
  useEffect(() => {
    const pre = document.getElementById("preloader");
    const t = setTimeout(() => pre && pre.classList.add("hidden"), 1700);
    return () => clearTimeout(t);
  }, []);

  /* scroll events */
  useEffect(() => {
    const onScroll = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (progressRef.current) progressRef.current.style.width = pct + "%";
      if (navRef.current) navRef.current.classList.toggle("scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 3D tilt + specular on hero + cards (pointer devices) */
  useEffect(() => setupPointerTilts(), []);

  /* cursor */
  useEffect(() => {
    if (!window.matchMedia("(pointer:fine)").matches) return;
    const move = e => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX - 6 + "px";
        cursorRef.current.style.top  = e.clientY - 6 + "px";
      }
    };
    document.addEventListener("mousemove", move);
    const hoverEls = document.querySelectorAll("a,button,.project-card,.skill-category,.cert-card,.award-card");
    hoverEls.forEach(el => {
      el.addEventListener("mouseenter", () => cursorRef.current?.classList.add("big"));
      el.addEventListener("mouseleave", () => cursorRef.current?.classList.remove("big"));
    });
    return () => document.removeEventListener("mousemove", move);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    setFormMsg({ text: "", type: "" });
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name:    `${form.firstName} ${form.lastName}`,
          email:   form.email,
          phone:   form.phone,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
      setFormMsg({ text: "Message sent! I'll get back to you soon.", type: "success" });
      setTimeout(() => setFormMsg({ text: "", type: "" }), 5000);
    } catch {
      setFormMsg({ text: "Something went wrong. Please try emailing me directly.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Cursor */}
      <div className="cursor" ref={cursorRef} />

      {/* Preloader */}
      <div id="preloader">
        <div className="pre-text">BALAJI<span>.</span></div>
      </div>

      {/* Progress */}
      <div id="progress-bar" ref={progressRef} />

      {/* Nav */}
      <nav ref={navRef} id="navbar">
        <div className="nav-logo">BALAJI<span>.</span></div>
        <div className="nav-links">
          {["about","experience","projects","skills","certifications","contact"].map(s => (
            <a key={s} href={`#${s}`}>{s === "certifications" ? "Certs" : s.charAt(0).toUpperCase()+s.slice(1)}</a>
          ))}
        </div>
        <div className={`hamburger ${menuOpen ? "active" : ""}`} id="hamburger" onClick={() => setMenuOpen(p => !p)}>
          <span /><span /><span />
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {[["about","About"],["experience","Experience"],["projects","Projects"],["skills","Skills"],["certifications","Certifications"],["contact","Contact"]].map(([id,label]) => (
          <a key={id} href={`#${id}`} onClick={closeMenu}>{label}</a>
        ))}
      </div>

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">Python · AI/ML · Full Stack · Data Engineering</div>
            <h1 className="hero-name">BALAJI<br /><span className="accent">GADE</span></h1>
            <p className="hero-role">
              <strong>Python Full Stack Developer &amp; AI Engineer</strong> — B.Tech CSE (AI &amp; ML) Graduate<br />
              Building intelligent systems, data pipelines &amp; real-world AI solutions.
            </p>
            <div className="hero-actions">
              <a href="#projects" className="btn btn-primary">View Projects</a>
              <a href="#contact"  className="btn btn-outline">Get In Touch</a>
            </div>
          </div>
          <div className="hero-portrait-col">
            <div className="portrait-frame" data-tilt data-tilt-max="15" data-tilt-scale="1.05" data-tilt-ease="0.1">
              <div className="portrait-ring-outer" />
              <div className="portrait-ring-inner" />
              <div className="portrait-glow-blob" />
              <div className="portrait-img-wrap">
                <img
                  src="img/balaji.jpg"
                  alt="Balaji Gade"
                  className="portrait-img"
                  onError={e => { e.currentTarget.parentElement.innerHTML = '<div class="portrait-placeholder">BG</div>'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about">
        <div className="section-label reveal">Who I Am</div>
        <h2 className="section-title reveal">About <span className="thin">Me</span></h2>
        <div className="divider reveal" />
        <div className="about-grid">
          <div className="reveal">
            <div className="about-text">
              <p>I'm a <strong>B.Tech Computer Science &amp; Engineering (AI &amp; ML)</strong> graduate from SIETK, Puttur, passionate about building end-to-end data-driven solutions that create real impact.</p>
              <p>With hands-on internship experience in Python Full Stack Development, I've engineered <strong>data pipelines, SQL-optimised systems, and AI/NLP tools</strong> that dramatically reduced manual effort and improved accuracy.</p>
              <p>My research-level work in adversarial ML security and real-time object detection reflects a deep curiosity for pushing the boundaries of what intelligent systems can do.</p>
            </div>
          </div>
          <div className="reveal">
            <div className="education-card" data-tilt data-tilt-max="9" data-tilt-scale="1.025">
              <h4>B.Tech – Computer Science &amp; Engineering</h4>
              <div className="inst">AI &amp; Machine Learning Specialisation</div>
              <div className="meta">Siddharth Institute of Engineering &amp; Technology (SIETK), Puttur, AP</div>
              <div className="meta" style={{ marginTop: ".3rem" }}>Graduated: April 2025 &nbsp;&nbsp;</div>
              <div className="coursework-label">Relevant Coursework</div>
              <div className="coursework-tags">
                {["Data Structures & Algorithms","DBMS","Operating Systems","Computer Networks","Discrete Mathematics"].map(c => (
                  <span key={c} className="tag">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="experience">
        <div className="section-label reveal">Career</div>
        <h2 className="section-title reveal">Professional <span className="thin">Experience</span></h2>
        <div className="divider reveal" />
        <div className="exp-card reveal" data-tilt data-tilt-max="7" data-tilt-scale="1.012">
          <div className="exp-header">
            <div>
              <div className="exp-role">Python Full Stack Developer Intern</div>
              <div className="exp-company">Code Genius Innovations &nbsp;·&nbsp; Remote</div>
            </div>
            <div className="exp-badge">Internship</div>
          </div>
          <div className="exp-list">
            {[
              <>Engineered end-to-end data pipelines — ingestion, transformation, validation &amp; reporting — using Python and SQL, replacing manual workflows and achieving a <span className="exp-highlight">60% reduction in processing time</span>.</>,
              <>Optimised complex SQL queries using advanced joins, subqueries, and indexing strategies, improving data retrieval speed by <span className="exp-highlight">35%</span> across large relational datasets.</>,
              "Developed dynamic reports and dashboards to deliver actionable insights to stakeholders.",
              "Collaborated in Agile/Scrum workflows using JIRA across cross-functional teams.",
              "Implemented unit testing and validation logic for automated scripts, ensuring production-grade reliability.",
            ].map((item, i) => (
              <div key={i} className="exp-item">
                <span className="exp-bullet">▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects">
        <div className="section-label reveal">Work</div>
        <h2 className="section-title reveal">Key <span className="thin">Projects</span></h2>
        <div className="divider reveal" />
        <div className="projects-grid">

          {/* 01 — Automated Student Result Reporting System */}
          <div className="project-card reveal" data-tilt data-tilt-max="12" data-tilt-scale="1.04">
            <div className="project-num">01</div>
            <div className="project-title">Automated Student Result Reporting System</div>
            <div className="project-desc">Built an automated pipeline processing 3,240+ records using Python (Pandas) and SQL. Implemented multi-stage data validation achieving exceptional accuracy. Executed rigorous E2E and unit testing.</div>
            <div className="project-footer">
              <div className="project-metrics">
                <span className="metric">3,240+ Records</span>
                <span className="metric">99.8% Accuracy</span>
                <span className="metric">90% Faster</span>
              </div>
              <a href="https://github.com/BB6689" target="_blank" rel="noreferrer" className="project-link-btn">
                <GithubIcon /> GitHub
              </a>
            </div>
          </div>

          {/* 02 — Security Vulnerabilities in Multi-Exit Neural Networks */}
          <div className="project-card reveal" data-tilt data-tilt-max="12" data-tilt-scale="1.04">
            <div className="project-num">02</div>
            <div className="project-title">Security Vulnerabilities in Multi-Exit Neural Networks</div>
            <div className="project-desc">AI Security Research — implemented a Sponge Attack using PyTorch to expose adversarial vulnerabilities in traffic-sign classification systems, highlighting critical risks in production ML models.</div>
            <div className="project-footer">
              <div className="project-award">🏆 2nd Prize — CSE Technogeeks</div>
              <a href="https://github.com/BB6689" target="_blank" rel="noreferrer" className="project-link-btn">
                <GithubIcon /> GitHub
              </a>
            </div>
          </div>

          {/* 03 — Intelligent Document Analysis Tool */}
          <div className="project-card reveal" data-tilt data-tilt-max="12" data-tilt-scale="1.04">
            <div className="project-num">03</div>
            <div className="project-title">Intelligent Document Analysis Tool</div>
            <div className="project-desc">Built NLP pipelines leveraging LLMs and vector embeddings (LlamaIndex) for automated document summarisation and unstructured data extraction, reducing manual review time by 40%.</div>
            <div className="project-footer">
              <div className="project-metrics">
                <span className="metric">LLMs</span>
                <span className="metric">LlamaIndex</span>
                <span className="metric">40% Time Saved</span>
              </div>
              <a href="https://github.com/BB6689" target="_blank" rel="noreferrer" className="project-link-btn">
                <GithubIcon /> GitHub
              </a>
            </div>
          </div>

          {/* 04 — Real-Time Object Detection & Performance Benchmarking */}
          <div className="project-card reveal" data-tilt data-tilt-max="12" data-tilt-scale="1.04">
            <div className="project-num">04</div>
            <div className="project-title">Real-Time Object Detection &amp; Performance Benchmarking</div>
            <div className="project-desc">Evaluated YOLO and SSD models optimised for low-compute edge environments, benchmarking performance across compute-constrained scenarios with rigorous metrics analysis.</div>
            <div className="project-footer">
              <div className="project-award">🏅 Consolation Prize — FY Project Expo</div>
              <a href="https://github.com/BB6689" target="_blank" rel="noreferrer" className="project-link-btn">
                <GithubIcon /> GitHub
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills">
        <div className="section-label reveal">Expertise</div>
        <h2 className="section-title reveal">Technical <span className="thin">Skills</span></h2>
        <div className="divider reveal" />
        <div className="skills-grid">
          {[
            { title: "Languages", tags: ["Python (Advanced)","SQL (Advanced)","Rust","Java","HTML / CSS","JavaScript"] },
            { title: "Databases", tags: ["PostgreSQL","MongoDB","PL/SQL","T-SQL","Relational DB"] },
            { title: "Data & Analytics", tags: ["ETL/ELT Pipelines","Databricks","Alteryx","Pandas","NumPy","Query Optimisation","Data Cleaning","Statistical Analysis"] },
            { title: "BI & Visualisation", tags: ["Power BI","Tableau"] },
            { title: "AI / ML", tags: ["Scikit-learn","PyTorch","TensorFlow","LLMs","Vector Databases","LlamaIndex"] },
            { title: "Cloud & DevOps", tags: ["AWS","GCP","CI/CD","Git","Agile / JIRA","Linux (Fedora)"] },
            { title: "Cybersecurity", tags: ["Vulnerability Assessment","Secure Coding","Adversarial ML"] },
            { title: "Tools & Practices", tags: ["SDLC","Unit Testing","VS Code","Scrum"] },
          ].map(cat => (
            <div key={cat.title} className="skill-category reveal" data-tilt data-tilt-max="11" data-tilt-scale="1.035">
              <div className="skill-cat-title">{cat.title}</div>
              <div className="skill-tags">
                {cat.tags.map(t => <span key={t} className="skill-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CERTIFICATIONS ── */}
      <section id="certifications">
        <div className="section-label reveal">Credentials</div>
        <h2 className="section-title reveal">Certifications <span className="thin">&amp; Licences</span></h2>
        <div className="divider reveal" />
        <div className="certs-grid">
          {/* 1 — HP LIFE */}
          <a href="https://www.life-global.org/certificate/7a5da8ab-ac91-4634-9a3a-9a2f88addd3d" target="_blank" rel="noreferrer" className="cert-card reveal" data-tilt data-tilt-max="10" data-tilt-scale="1.03">
            <div className="cert-icon-wrap">
              <img src="img/certs/cert1.png" alt="HP LIFE Certificate" onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="cert-info">
              <div className="cert-name">Data Science & Analytics</div>
              <div className="cert-org">HP LIFE</div>
              <div className="cert-view">View Certificate →</div>
            </div>
          </a>

          {/* 2 — Google */}
          <a href="https://www.coursera.org/account/accomplishments/specialization/BFOFM9I3GRRZ" target="_blank" rel="noreferrer" className="cert-card reveal" data-tilt data-tilt-max="10" data-tilt-scale="1.03">
            <div className="cert-icon-wrap">
              <img src="img/certs/cert2.png" alt="Google Cybersecurity Specialisation" onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="cert-info">
              <div className="cert-name">Google Cybersecurity Specialisation</div>
              <div className="cert-org">Google</div>
              <div className="cert-view">View Certificate →</div>
            </div>
          </a>

          {/* 3 — IBM */}
          <a href="https://credentials.edx.org/credentials/61440624e96440d389625b04ab2da16c/" target="_blank" rel="noreferrer" className="cert-card reveal" data-tilt data-tilt-max="10" data-tilt-scale="1.03">
            <div className="cert-icon-wrap">
              <img src="img/certs/cert3.png" alt="IBM Cybersecurity Analyst" onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="cert-info">
              <div className="cert-name">IBM Cybersecurity Analyst</div>
              <div className="cert-org">IBM</div>
              <div className="cert-view">View Certificate →</div>
            </div>
          </a>

          {/* 4 — NPTEL */}
          <a href="https://archive.nptel.ac.in/content/noc/NOC23/SEM1/Ecertificates/106/noc23-cs20/Course/NPTEL23CS20S2480056204080512.jpg" target="_blank" rel="noreferrer" className="cert-card reveal" data-tilt data-tilt-max="10" data-tilt-scale="1.03">
            <div className="cert-icon-wrap">
              <img src="img/certs/cert4.png" alt="Joy of Computing using Python" onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="cert-info">
              <div className="cert-name">Joy of Computing using Python</div>
              <div className="cert-org">NPTEL</div>
              <div className="cert-view">View Certificate →</div>
            </div>
          </a>

          {/* 5 — DeepLearning.AI */}
          <a href="https://www.coursera.org/account/accomplishments/verify/VN6NHQK2CZTG" target="_blank" rel="noreferrer" className="cert-card reveal" data-tilt data-tilt-max="10" data-tilt-scale="1.03">
            <div className="cert-icon-wrap">
              <img src="img/certs/cert5.png" alt="Generative AI for Everyone" onError={e => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div className="cert-info">
              <div className="cert-name">Generative AI for Everyone</div>
              <div className="cert-org">DeepLearning.AI</div>
              <div className="cert-view">View Certificate →</div>
            </div>
          </a>

        </div>
      </section>

      {/* ── AWARDS ── */}
      <section id="awards" style={{ background: "var(--black)" }}>
        <div className="section-label reveal">Recognition</div>
        <h2 className="section-title reveal">Honors <span className="thin">&amp; Awards</span></h2>
        <div className="divider reveal" />
        <div className="awards-row">
          {[
            { medal: "🥈", title: "2nd Prize",         desc: "CSE Technogeeks Departmental Symposium — AI Security Research on adversarial vulnerabilities in multi-exit neural networks using PyTorch." },
            { medal: "🏅", title: "Consolation Prize", desc: "Final Year Project Expo — Real-Time Object Detection & Performance Benchmarking, achieved as a Third Year student participant." },
          ].map(a => (
            <div key={a.title} className="award-card reveal" data-tilt data-tilt-max="9" data-tilt-scale="1.025">
              <div className="award-glow" />
              <div className="award-medal">{a.medal}</div>
              <div className="award-title">{a.title}</div>
              <div className="award-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact">
        <div className="section-label reveal">Let's Connect</div>
        <h2 className="section-title reveal">Get In <span className="thin">Touch</span></h2>
        <div className="divider reveal" />
        <div className="contact-grid">

          <div className="contact-form-card reveal">
            <h3>Contact Box</h3>
            <p>Leave your details below and I'll get back to you.</p>
            <div className="form-row">
              <label className="form-field">
                <span>First Name *</span>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required />
              </label>
              <label className="form-field">
                <span>Last Name *</span>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field full-width">
                <span>Email *</span>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field full-width">
                <span>Phone *</span>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field full-width">
                <span>Message *</span>
                <textarea name="message" rows={4} value={form.message} onChange={handleChange} required />
              </label>
            </div>
            <button
              className="btn btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send"}
            </button>
            {formMsg.text && (
              <div className={formMsg.type === "success" ? "form-success" : "form-error"}>
                {formMsg.text}
              </div>
            )}
          </div>

          <div className="contact-sidebar">
            <div className="contact-info reveal">
              {[
                { icon: "📧", label: "Email",    value: <a href="mailto:balajigade136@gmail.com">balajigade136@gmail.com</a> },
                { icon: "📍", label: "Location", value: "Tirupati, Andhra Pradesh" },
                { icon: "💼", label: "LinkedIn", value: <a href="https://linkedin.com/in/balajigade" target="_blank" rel="noreferrer">linkedin.com/in/balajigade</a> },
              ].map(item => (
                <div key={item.label} className="contact-item">
                  <div className="contact-item-icon">{item.icon}</div>
                  <div className="contact-item-text">
                    <div className="label">{item.label}</div>
                    <div className="value">{item.value}</div>
                  </div>
                </div>
              ))}
              <div className="reloc-section">
                <div className="reloc-title">Open to Relocate</div>
                <div className="reloc-tags">
                  {["Chennai","Coimbatore","Bangalore","Kochi","Hyderabad","Mumbai","Pune","Delhi","Noida"].map(c => (
                    <span key={c} className="reloc-tag">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-cta reveal">
              <h3>Ready to Collaborate?</h3>
              <p>I'm actively looking for full-time opportunities in Python development, data engineering, and AI/ML roles. Whether you have a project in mind or an open position — let's talk.</p>
              <div className="cta-links">
                <a href="mailto:balajigade136@gmail.com" className="cta-link"><span>Send me an Email</span></a>
                <a href="https://linkedin.com/in/balajigade" target="_blank" rel="noreferrer" className="cta-link"><span>Connect on LinkedIn</span></a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-logo">BALAJI<span>.</span></div>
        <div className="footer-copy">© 2025 Balaji Gade. All rights reserved.</div>
        <a href="#hero" className="footer-back">↑ Back to Top</a>
      </footer>

    </>
  );
}