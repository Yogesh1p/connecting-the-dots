/* ============================================================
   pos_enc.js
   Figure 1 · Unit Circle Positional Encoding
============================================================ */

(() => {
    const canvas = document.getElementById("pe-unit-circle");
    const slider = document.getElementById("omega-slider");
    const value = document.getElementById("omega-value");

    if (!canvas || !slider || !value) return;

    const ctx = canvas.getContext("2d");

    let omega = parseFloat(slider.value);
    let tick = 0;
    const N = 16;

    function withAlpha(hex, alpha) {
        if (!hex.startsWith("#")) return hex;

        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth;
        const height = parseInt(canvas.getAttribute("height"), 10);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        return { width, height };
    }

    let { width, height } = resize();

    window.addEventListener("resize", () => {
        ({ width, height } = resize());
    });

    slider.addEventListener("input", () => {
        omega = parseFloat(slider.value);
        value.textContent = omega.toFixed(2);
    });

    function drawCircle(x, y, r, color, lineWidth = 1.5) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    function drawDot(x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function draw() {
        const styles = getComputedStyle(document.documentElement);
        const accent = styles.getPropertyValue("--accent").trim() || "#D48C70";
        const border = styles.getPropertyValue("--border").trim() || "#cccccc";
        const text = styles.getPropertyValue("--text").trim() || "#222222";
        const muted = styles.getPropertyValue("--muted").trim() || "#777777";

        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const R = Math.min(width, height) * 0.32;

        /* axes */
        ctx.strokeStyle = withAlpha(border, 0.8);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - R - 14, cy);
        ctx.lineTo(cx + R + 14, cy);
        ctx.moveTo(cx, cy - R - 14);
        ctx.lineTo(cx, cy + R + 14);
        ctx.stroke();

        /* axis labels */
        ctx.font = "10px Lora, serif";
        ctx.fillStyle = muted;
        ctx.textAlign = "center";
        ctx.fillText("cos", cx + R + 22, cy);
        ctx.fillText("sin", cx, cy - R - 18);

        /* main circle */
        drawCircle(cx, cy, R, border);

        /* positional sequence dots */
        for (let i = 0; i < N; i++) {
            const angle = omega * i;
            const x = cx + R * Math.cos(angle);
            const y = cy - R * Math.sin(angle);

            const alpha = 0.2 + 0.6 * (i / N);
            drawDot(x, y, i === 0 ? 4 : 3, withAlpha(accent, alpha));

            if (i < 9) {
                ctx.fillStyle = muted;
                ctx.font = "9px Lora, serif";
                ctx.fillText(i.toString(), x + (x > cx ? 10 : -10), y);
            }
        }

        /* active animated token */
        const active = Math.floor((tick * 0.55) % N);
        const angle = omega * active;

        const px = cx + R * Math.cos(angle);
        const py = cy - R * Math.sin(angle);

        /* radial guide */
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = withAlpha(accent, 0.5);
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();

        /* angle arc */
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.22, 0, -angle, angle >= 0);
        ctx.strokeStyle = withAlpha(accent, 0.35);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const mid = -angle / 2;
        ctx.fillStyle = accent;
        ctx.font = "10px Lora, serif";
        ctx.fillText(
            `ω·${active}`,
            cx + R * 0.28 * Math.cos(mid),
            cy + R * 0.28 * Math.sin(mid)
        );

        /* active dot */
        drawDot(px, py, 6, accent);

        /* formula readout */
        ctx.font = "11px Lora, serif";
        ctx.fillStyle = text;
        ctx.textAlign = "center";
        ctx.fillText(
            `PE(${active}) = [${Math.cos(angle).toFixed(2)}, ${Math.sin(angle).toFixed(2)}]`,
            cx,
            height - 18
        );

        tick += 0.025;
        requestAnimationFrame(draw);
    }

    draw();
})();