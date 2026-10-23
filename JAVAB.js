// =========================================================
//  XV Años · Alicia Reyes
//  Flujo: botón "Entrar a la invitación" → video de la madriguera
//  + música (ambos arrancan con el mismo toque, requisito de
//  Safari/iPhone) → transición de luz dorada → invitación.
// =========================================================

let isPlaying = false;
let introDone = false;

const EVENT_DATE = new Date('2026-12-19T18:30:00-04:00'); // 6:30 pm hora RD
const MAPS_URL = 'https://maps.app.goo.gl/jagL2jun8yeA1Pz1A?g_st=aw';

document.addEventListener('DOMContentLoaded', function () {
    initializeCountdown();

    const video = document.getElementById('introPlayer');
    if (video) {
        video.muted = true;            // el video siempre sin sonido
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        try { video.load(); } catch (e) {}
    }

    const enterBtn = document.getElementById('enterBtn');
    if (enterBtn) enterBtn.addEventListener('click', enterInvitation);

    const skip = document.getElementById('skipIntro');
    if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); finishIntro(); });

    const toggle = document.getElementById('musicToggle');
    if (toggle) toggle.addEventListener('click', toggleMusic);

    const music = document.getElementById('bgMusic');
    if (music) {
        music.addEventListener('play', function () { isPlaying = true; updateMusicIcon(); });
        music.addEventListener('pause', function () { isPlaying = false; updateMusicIcon(); });
    }

    // Mientras se ve la pantalla de inicio / video, la página no se desplaza
    document.body.classList.add('is-locked');
});

// ---------- Entrada: TODO ocurre dentro del mismo toque ----------
let entered = false;
function enterInvitation() {
    if (entered) return;
    entered = true;

    const intro = document.getElementById('introVideo');
    const video = document.getElementById('introPlayer');
    const music = document.getElementById('bgMusic');

    // 1) Música: play() síncrono dentro del toque (Safari/iOS lo exige)
    if (music) {
        try {
            music.volume = 1;
            const p = music.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    }

    // 2) Video sin sonido, también dentro del toque
    if (intro) intro.classList.add('playing');   // oculta el botón y muestra "Saltar"
    if (video) {
        video.muted = true;
        video.addEventListener('ended', finishIntro, { once: true });
        // Si se acerca al final, empezamos la luz dorada un instante antes
        video.addEventListener('timeupdate', function () {
            if (video.duration && video.currentTime >= video.duration - 0.35) finishIntro();
        });
        let ok = true;
        try {
            const vp = video.play();
            if (vp && vp.then) {
                vp.then(function () {
                    const d = (isFinite(video.duration) && video.duration > 0) ? video.duration : 10;
                    setTimeout(finishIntro, (d + 2.5) * 1000);   // respaldo
                }).catch(function () { setTimeout(finishIntro, 900); });
            }
        } catch (e) { ok = false; }
        if (!ok) setTimeout(finishIntro, 900);
        // Si el video tarda demasiado en arrancar (conexión lenta)
        setTimeout(function () { if (video.currentTime < 0.1) finishIntro(); }, 8000);
    } else {
        finishIntro();
    }

    document.getElementById('musicPlayer').style.display = 'block';
}

// ---------- Transición de luz dorada ----------
function finishIntro() {
    if (introDone) return;
    introDone = true;

    const intro = document.getElementById('introVideo');
    const flash = document.getElementById('goldFlash');
    const video = document.getElementById('introPlayer');

    window.scrollTo(0, 0);
    if (flash) flash.classList.add('on');      // la luz dorada llena la pantalla
    launchSparkles();

    setTimeout(function () {
        if (intro) intro.classList.remove('show');
        if (video) { try { video.pause(); } catch (e) {} }
        document.body.classList.remove('is-locked');
        document.body.classList.add('revealed'); // la portada aparece con un suave zoom
        if (flash) flash.classList.add('off');   // la luz se disuelve
    }, 650);

    setTimeout(function () {
        if (flash) flash.remove();
        if (intro) intro.remove();
    }, 2600);
}

// Destellos dorados que se dispersan sobre la portada
function launchSparkles() {
    const canvas = document.getElementById('sparkles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    canvas.classList.add('on');

    const cx = W / 2, cy = H * 0.45;
    const parts = [];
    const N = Math.round(Math.min(160, W * 0.35));
    for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 6;
        parts.push({
            x: cx + (Math.random() - 0.5) * 60,
            y: cy + (Math.random() - 0.5) * 60,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 1,
            r: 0.8 + Math.random() * 2.6,
            life: 0,
            max: 70 + Math.random() * 70,
            star: Math.random() < 0.35
        });
    }

    function drawStar(x, y, r, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFF3D1';
        ctx.beginPath();
        const s = r * 3.2;
        ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
        ctx.restore();
    }

    let frame = 0;
    (function tick() {
        frame++;
        ctx.clearRect(0, 0, W, H);
        let alive = 0;
        for (const p of parts) {
            p.life++;
            if (p.life > p.max) continue;
            alive++;
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.03;
            const t = p.life / p.max;
            const alpha = Math.sin(Math.PI * t) * 0.95;
            if (p.star) {
                drawStar(p.x, p.y, p.r, alpha);
            } else {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                g.addColorStop(0, 'rgba(255,248,225,' + alpha + ')');
                g.addColorStop(0.4, 'rgba(232,196,120,' + alpha * 0.7 + ')');
                g.addColorStop(1, 'rgba(232,196,120,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
            }
        }
        if (alive > 0 && frame < 260) requestAnimationFrame(tick);
        else canvas.remove();
    })();
}

// ---------- Música ----------
function toggleMusic() {
    const music = document.getElementById('bgMusic');
    if (!music) return;
    if (music.paused) {
        const p = music.play();
        if (p && p.catch) p.catch(function () {});
    } else {
        music.pause();
    }
}

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    if (!volumeIcon) return;
    if (isPlaying) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3F5D82"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#3F5D82" stroke-width="2" stroke-linecap="round"></path>`;
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3F5D82"></polygon>
            <line x1="16" y1="9" x2="22" y2="15" stroke="#B23A48" stroke-width="2" stroke-linecap="round"></line>
            <line x1="22" y1="9" x2="16" y2="15" stroke="#B23A48" stroke-width="2" stroke-linecap="round"></line>`;
    }
}

// ---------- Cuenta regresiva ----------
function initializeCountdown() {
    const targetDate = EVENT_DATE.getTime();
    function pad(n) { return n.toString().padStart(2, '0'); }
    function updateCountdown() {
        const diff = targetDate - Date.now();
        let d = 0, h = 0, m = 0, s = 0;
        if (diff > 0) {
            d = Math.floor(diff / 86400000);
            h = Math.floor((diff % 86400000) / 3600000);
            m = Math.floor((diff % 3600000) / 60000);
            s = Math.floor((diff % 60000) / 1000);
        }
        document.getElementById('days').textContent = pad(d);
        document.getElementById('hours').textContent = pad(h);
        document.getElementById('minutes').textContent = pad(m);
        document.getElementById('seconds').textContent = pad(s);
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ---------- Botones ----------
function openLocation() {
    window.open(MAPS_URL, '_blank');
}

// NOTA: reemplaza estos enlaces de ejemplo por los reales.
function sharePhotos() {
    window.open('https://photos.app.goo.gl/4ZHMfmNcHY4v1AXq6', '_blank');
}

function showDressCode() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) modal.style.display = 'flex';
}

function closeDressCodeModal() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) modal.style.display = 'none';
}

function showGifts() {
    window.open('https://cuentapro11.github.io/numero-cuenta-ejemplo/', '_blank');
}

function confirmAttendance() {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScSjW4vtkYhi-KK_qFRDGw47fGlYPJmIRJIVnVrHyn89htAZQ/viewform?usp=publish-editor', '_blank');
}

// Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    toastContent.innerHTML = `
        <h4 style="font-weight: 700; color: #3F5D82; margin-bottom: 0.35rem;">${title}</h4>
        <p style="color: #5D5E70;">${message}</p>`;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 4000);
}
