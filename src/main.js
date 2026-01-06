import './index.css'

// Options for the Intersection Observer
const observerOptions = {
    root: null, // Use the viewport as the container
    rootMargin: '0px',
    threshold: 0.15 // Trigger when 15% of the element is visible
};

// Callback function when intersection changes
const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Stop observing once visible to run animation only once
            observer.unobserve(entry.target);
        }
    });
};

// Create the observer
const observer = new IntersectionObserver(observerCallback, observerOptions);

// Select elements to animate
const animatedElements = document.querySelectorAll('.reveal-text, .reveal-img, .reveal-left, .reveal-right, .reveal-circle');

// Start observing each element
animatedElements.forEach(el => observer.observe(el));

// --- PARTICLE ATTRACTION EFFECT ---
class AnimatedBg {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'focus-bg';
        this.ctx = this.canvas.getContext('2d');
        // Ensure canvas is first child to be behind everything else (stacked by z-index anyway)
        if (container.firstChild) {
            container.insertBefore(this.canvas, container.firstChild);
        } else {
            container.appendChild(this.canvas);
        }

        this.resize();
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.animationId = null;

        this.initParticles();
        this.addEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    initParticles() {
        // Reduced count for geometry cleanliness
        const count = 40;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2 + 1
            });
        }
    }

    addEvents() {
        // We track mouse relative to the container
        this.moveHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };
        // Attach to window so we track even if mouse is slightly off canvas but in section
        window.addEventListener('mousemove', this.moveHandler);

        // Keep resize updated
        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);
    }

    destroy() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('resize', this.resizeHandler);
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and Draw Particles
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse Attraction (Geometry)
            if (this.mouse.x != null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 150})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();

                    // Gentle pull towards mouse
                    p.x += dx * 0.02;
                    p.y += dy * 0.02;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
            this.ctx.fill();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// --- INTERACTIVE FOCUS LOGIC ---
const sections = document.querySelectorAll('section');
const body = document.body;
let currentEffect = null;

function setFocus(section) {
    // If already focused, do nothing
    if (section.classList.contains('focused')) return;

    // Cleanup old effect if exists
    if (currentEffect) {
        currentEffect.destroy();
        currentEffect = null;
    }

    // UI Updates
    sections.forEach(s => s.classList.remove('focused'));
    section.classList.add('focused');
    body.classList.add('has-focus');

    // Start New Effect
    currentEffect = new AnimatedBg(section);
}

function removeFocus() {
    if (currentEffect) {
        currentEffect.destroy();
        currentEffect = null;
    }
    sections.forEach(s => s.classList.remove('focused'));
    body.classList.remove('has-focus');
}

sections.forEach(sec => {
    sec.addEventListener('click', (e) => {
        // If it's not focused, focus it. 
        // If it IS focused, we want to allow normal interaction (text selection)
        if (!sec.classList.contains('focused')) {
            setFocus(sec);
            e.stopPropagation();
        } else {
            // Just stop prop so body doesn't handle it
            e.stopPropagation();
        }
    });
});

// Clicking anywhere else (the body/dimmed areas) removes focus
document.addEventListener('click', () => {
    removeFocus();
});

// --- SCROLL CAROUSEL LOGIC ---
window.addEventListener('scroll', () => {
    // Only active if we are in 'focus mode'
    if (!body.classList.contains('has-focus')) return;

    let closestSection = null;
    let minDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;

    sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        const sectionCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(viewportCenter - sectionCenter);

        if (distance < minDistance) {
            minDistance = distance;
            closestSection = sec;
        }
    });

    if (closestSection && !closestSection.classList.contains('focused')) {
        setFocus(closestSection);
    }
});
