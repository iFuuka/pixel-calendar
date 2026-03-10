import React, { useState, useRef, useCallback } from 'react';
import './HourlyTempChart.css';

function toF(c) { return Math.round(c * 9 / 5 + 32); }

function smoothPath(pts) {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].px},${pts[0].py} L${pts[1].px},${pts[1].py}`;
    let d = `M${pts[0].px},${pts[0].py}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const t = 0.35;
        d += ` C${p1.px + (p2.px - p0.px) * t},${p1.py + (p2.py - p0.py) * t} ${p2.px - (p3.px - p1.px) * t},${p2.py - (p3.py - p1.py) * t} ${p2.px},${p2.py}`;
    }
    return d;
}

function interpolateTemp(points, hour) {
    if (hour <= points[0].hour) return points[0];
    if (hour >= points[points.length - 1].hour) return points[points.length - 1];
    for (let i = 0; i < points.length - 1; i++) {
        if (hour >= points[i].hour && hour <= points[i + 1].hour) {
            const f = (hour - points[i].hour) / (points[i + 1].hour - points[i].hour);
            return {
                hour,
                temp: Math.round(points[i].temp + f * (points[i + 1].temp - points[i].temp)),
                px: points[i].px + f * (points[i + 1].px - points[i].px),
                py: points[i].py + f * (points[i + 1].py - points[i].py),
            };
        }
    }
    return points[0];
}

/**
 * Map a temperature (°C) to a color.
 *   cold (<=−10) → deep blue
 *   cool (~0)    → cyan
 *   mild (~10)   → green
 *   warm (~20)   → yellow
 *   hot  (>=35)  → red-orange
 */
function tempColor(tempC) {
    const stops = [
        { t: -10, r: 80, g: 120, b: 230 },
        { t: 0,   r: 70, g: 190, b: 220 },
        { t: 10,  r: 80, g: 200, b: 120 },
        { t: 20,  r: 240, g: 200, b: 50 },
        { t: 30,  r: 240, g: 130, b: 40 },
        { t: 40,  r: 220, g: 60,  b: 60 },
    ];
    if (tempC <= stops[0].t) return `rgb(${stops[0].r},${stops[0].g},${stops[0].b})`;
    if (tempC >= stops[stops.length - 1].t)
        return `rgb(${stops[stops.length - 1].r},${stops[stops.length - 1].g},${stops[stops.length - 1].b})`;
    for (let i = 0; i < stops.length - 1; i++) {
        if (tempC >= stops[i].t && tempC <= stops[i + 1].t) {
            const f = (tempC - stops[i].t) / (stops[i + 1].t - stops[i].t);
            const r = Math.round(stops[i].r + f * (stops[i + 1].r - stops[i].r));
            const g = Math.round(stops[i].g + f * (stops[i + 1].g - stops[i].g));
            const b = Math.round(stops[i].b + f * (stops[i + 1].b - stops[i].b));
            return `rgb(${r},${g},${b})`;
        }
    }
    return `rgb(200,200,200)`;
}

/**
 * Find contiguous rain periods where precipProb >= threshold.
 * Returns [{ startHour, endHour, maxProb }]
 */
function findRainPeriods(hourly, threshold = 30) {
    const periods = [];
    let current = null;
    for (const h of hourly) {
        const prob = h.precipProb ?? 0;
        if (prob >= threshold) {
            if (!current) {
                current = { startHour: h.hour, endHour: h.hour, maxProb: prob };
            } else {
                current.endHour = h.hour;
                current.maxProb = Math.max(current.maxProb, prob);
            }
        } else if (current) {
            periods.push(current);
            current = null;
        }
    }
    if (current) periods.push(current);
    return periods;
}

export default function HourlyTempChart({ hourly = [], tempUnit = 'C', lang = 'en', t }) {
    const tr = t || ((k, fb) => fb || k);
    const svgRef = useRef(null);
    const [hover, setHover] = useState(null);

    if (!hourly || hourly.length === 0) return null;

    const temps = hourly.map((h) => tempUnit === 'F' ? toF(h.temp) : h.temp);
    const tempsC = hourly.map((h) => h.temp);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const range = maxT - minT || 1;
    const unit = tempUnit === 'F' ? '°F' : '°C';

    const W = 344;
    const H = 290;
    const padL = 42;
    const padR = 12;
    const padT = 40;
    const padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    function x(hour) { return padL + (hour / 23) * chartW; }
    function y(temp) { return padT + chartH - ((temp - minT) / range) * chartH; }

    const points = hourly.map((h, i) => ({
        px: x(h.hour), py: y(temps[i]), temp: temps[i], tempC: tempsC[i], hour: h.hour,
    }));

    const linePath = smoothPath(points);
    const areaPath = linePath
        + ` L${points[points.length - 1].px},${padT + chartH}`
        + ` L${points[0].px},${padT + chartH} Z`;

    const xLabels = [0, 6, 12, 18];

    const yStep = range <= 4 ? 1 : range <= 10 ? 2 : range <= 25 ? 5 : 10;
    const yGridMin = Math.floor(minT / yStep) * yStep;
    const yGridMax = Math.ceil(maxT / yStep) * yStep;
    const yLines = [];
    for (let v = yGridMin; v <= yGridMax; v += yStep) yLines.push(v);

    const labelPoints = points.filter((p) => p.hour % 6 === 0);

    // Rain periods
    const rainPeriods = findRainPeriods(hourly);

    // Gradient stops for the line (horizontal, colored by temperature)
    const lineGradStops = points.map((p) => ({
        offset: `${((p.px - padL) / chartW) * 100}%`,
        color: tempColor(p.tempC),
    }));

    // Hover
    const toSVG = useCallback((e) => {
        const svg = svgRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (W / rect.width),
            y: (e.clientY - rect.top) * (H / rect.height),
        };
    }, [W, H]);

    const handleMouseMove = useCallback((e) => {
        const pt = toSVG(e);
        if (pt && pt.x >= padL && pt.x <= W - padR) {
            setHover(pt);
        } else {
            setHover(null);
        }
    }, [toSVG, W, padL, padR]);

    const handleMouseLeave = useCallback(() => setHover(null), []);

    let hoverData = null;
    if (hover) {
        const hoverHour = ((hover.x - padL) / chartW) * 23;
        const interp = interpolateTemp(points, hoverHour);
        const interpC = tempUnit === 'F' ? Math.round((interp.temp - 32) * 5 / 9) : interp.temp;
        // Find nearest hour's precipProb
        const nearestIdx = hourly.reduce((best, h, i) =>
            Math.abs(h.hour - hoverHour) < Math.abs(hourly[best].hour - hoverHour) ? i : best, 0);
        const precipProb = hourly[nearestIdx]?.precipProb ?? 0;
        hoverData = { ...interp, tempC: interpC, precipProb };
    }

    return (
        <div className="hourly-chart-wrap">
            <p className="hourly-chart-title">{tr('weather.hourly', 'Temperature by hour')}</p>
            <svg
                ref={svgRef}
                className="hourly-chart-svg"
                viewBox={`0 0 ${W} ${H}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <defs>
                    {/* Horizontal gradient colored by temperature */}
                    <linearGradient id="htcLineGrad" x1="0" y1="0" x2="1" y2="0">
                        {lineGradStops.map((s, i) => (
                            <stop key={i} offset={s.offset} stopColor={s.color} />
                        ))}
                    </linearGradient>
                    {/* Area fill: same gradient but vertical fade to transparent */}
                    <linearGradient id="htcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.03" />
                    </linearGradient>
                    {/* Mask to combine horizontal color + vertical fade */}
                    <mask id="htcAreaMask">
                        <rect x={padL} y={padT} width={chartW} height={chartH} fill="url(#htcAreaGrad)" />
                    </mask>
                    <filter id="htcGlow">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                    </filter>
                </defs>

                {/* Y grid + labels */}
                {yLines.map((v) => (
                    <g key={'yg' + v}>
                        <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)}
                            stroke="var(--clr-border)" strokeWidth="0.7" strokeDasharray="4,3" opacity="0.5" />
                        <text x={padL - 7} y={y(v) + 5} textAnchor="end"
                            fontSize="13" fontWeight="700" fill="var(--clr-text)">
                            {v}{unit}
                        </text>
                    </g>
                ))}

                {/* Rain zones */}
                {rainPeriods.map((rp, i) => {
                    const rx1 = x(rp.startHour);
                    const rx2 = x(Math.min(rp.endHour + 1, 23));
                    const opacity = Math.min(0.18, 0.08 + (rp.maxProb / 100) * 0.12);
                    const midX = (rx1 + rx2) / 2;
                    const fmt = (h) => `${String(h).padStart(2, '0')}:00`;
                    const rainLabel = rp.startHour === rp.endHour
                        ? `${fmt(rp.startHour)}`
                        : `${fmt(rp.startHour)}–${fmt(Math.min(rp.endHour + 1, 23))}`;
                    return (
                        <g key={'rain' + i}>
                            <rect
                                x={rx1} y={padT} width={rx2 - rx1} height={chartH}
                                fill="#5b9bd5" opacity={opacity} rx="3"
                            />
                            {/* Rain stripes pattern */}
                            {Array.from({ length: Math.floor((rx2 - rx1) / 8) }, (_, j) => (
                                <line key={j}
                                    x1={rx1 + j * 8 + 4} y1={padT + 2}
                                    x2={rx1 + j * 8} y2={padT + 10}
                                    stroke="#5b9bd5" strokeWidth="1" opacity={opacity * 2}
                                />
                            ))}
                            {/* Label at top */}
                            <text x={midX} y={padT - 6} textAnchor="middle"
                                fontSize="10" fontWeight="700" fill="#5b9bd5" opacity="0.85">
                                &#x1F4A7; {rainLabel}
                            </text>
                        </g>
                    );
                })}

                {/* Colored area fill */}
                <path d={areaPath} fill="url(#htcLineGrad)" mask="url(#htcAreaMask)" />

                {/* Glow line (colored) */}
                <path d={linePath} fill="none"
                    stroke="url(#htcLineGrad)" strokeWidth="7"
                    strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#htcGlow)" opacity="0.35" />

                {/* Main colored line */}
                <path d={linePath} fill="none"
                    stroke="url(#htcLineGrad)" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots + labels every 6h */}
                {labelPoints.map((p) => {
                    const clr = tempColor(p.tempC);
                    return (
                        <g key={'dot' + p.hour}>
                            <circle cx={p.px} cy={p.py} r="7" fill={clr} opacity="0.15" />
                            <circle cx={p.px} cy={p.py} r="4.5"
                                fill="var(--clr-panel)" stroke={clr} strokeWidth="2.5" />
                            <text x={p.px} y={p.py - 14} textAnchor="middle"
                                fontSize="15" fontWeight="800" fill={clr}>
                                {p.temp}°
                            </text>
                        </g>
                    );
                })}

                {/* X axis */}
                <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH}
                    stroke="var(--clr-border)" strokeWidth="1" />
                {xLabels.map((h) => (
                    <g key={'xg' + h}>
                        <line x1={x(h)} x2={x(h)}
                            y1={padT + chartH} y2={padT + chartH + 6}
                            stroke="var(--clr-border)" strokeWidth="1" />
                        <text x={x(h)} y={padT + chartH + 22} textAnchor="middle"
                            fontSize="13" fontWeight="700" fill="var(--clr-text)">
                            {String(h).padStart(2, '0')}:00
                        </text>
                    </g>
                ))}

                {/* Hover indicator */}
                {hoverData && (
                    <g className="htc-hover-group">
                        {/* Vertical guide */}
                        <line x1={hoverData.px} x2={hoverData.px}
                            y1={padT} y2={padT + chartH}
                            stroke={tempColor(hoverData.tempC)} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />

                        {/* Dot on curve */}
                        <circle cx={hoverData.px} cy={hoverData.py} r="7"
                            fill={tempColor(hoverData.tempC)} opacity="0.2" />
                        <circle cx={hoverData.px} cy={hoverData.py} r="4.5"
                            fill="var(--clr-panel)" stroke={tempColor(hoverData.tempC)} strokeWidth="2.5" />

                        {/* Tooltip — flip below point if near the top */}
                        {(() => {
                            const clr = tempColor(hoverData.tempC);
                            const tipX = Math.max(55, Math.min(W - 55, hoverData.px));
                            const nearTop = hoverData.py - padT < 50;
                            const hh = Math.floor(hoverData.hour);
                            const mm = Math.round((hoverData.hour % 1) * 60);
                            const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
                            const hasRain = hoverData.precipProb > 0;
                            const boxH = hasRain ? 40 : 26;
                            const boxW = 108;
                            const halfW = boxW / 2;

                            if (nearTop) {
                                const tipY = hoverData.py + 24;
                                return (
                                    <g transform={`translate(${tipX}, ${tipY})`}>
                                        <polygon points="-5,-2 5,-2 0,-8" fill={clr} />
                                        <rect x={-halfW} y="0" width={boxW} height={boxH} rx="6" fill={clr} />
                                        <text x="0" y="17" textAnchor="middle"
                                            fontSize="13" fontWeight="700" fill="#fff">
                                            {timeStr}  {hoverData.temp}{unit}
                                        </text>
                                        {hasRain && (
                                            <text x="0" y="33" textAnchor="middle"
                                                fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.85)">
                                                &#x1F4A7; {hoverData.precipProb}%
                                            </text>
                                        )}
                                    </g>
                                );
                            }
                            const tipY = hoverData.py - 24;
                            return (
                                <g transform={`translate(${tipX}, ${tipY})`}>
                                    <rect x={-halfW} y={-boxH} width={boxW} height={boxH} rx="6" fill={clr} />
                                    <polygon points="-5,0 5,0 0,7" fill={clr} />
                                    <text x="0" y={-boxH + 17} textAnchor="middle"
                                        fontSize="13" fontWeight="700" fill="#fff">
                                        {timeStr}  {hoverData.temp}{unit}
                                    </text>
                                    {hasRain && (
                                        <text x="0" y={-boxH + 33} textAnchor="middle"
                                            fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.85)">
                                            &#x1F4A7; {hoverData.precipProb}%
                                        </text>
                                    )}
                                </g>
                            );
                        })()}
                    </g>
                )}
            </svg>
        </div>
    );
}
