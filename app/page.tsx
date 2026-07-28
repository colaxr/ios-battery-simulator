"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { toCanvas } from "html-to-image";

type UsageApp = {
  name: string;
  icon: string;
  minutes: number;
  color: string;
};

const initialApps: UsageApp[] = [
  { name: "微信", icon: "/wechat.png", minutes: 1400, color: "#7d7d82" },
  { name: "抖音", icon: "/douyin.png", minutes: 946, color: "#7d7d82" },
  { name: "小红书", icon: "/xiaohongshu.png", minutes: 618, color: "#7d7d82" },
  { name: "网易云音乐", icon: "/netease-music.png", minutes: 153, color: "#7d7d82" },
];

const dayFactors = [1.31, 0.50, 0.65, 0.74, 1.02, 0.56, 0];
const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];
const DESIGN_WIDTH = 591;
const DESIGN_HEIGHT = 1280;
const EXPORT_WIDTH = 1179;
const EXPORT_HEIGHT = 2556;

export default function Home() {
  const [statusTime, setStatusTime] = useState("21:07");
  const [battery, setBattery] = useState(19);
  const [signalBars, setSignalBars] = useState(4);
  const [wifiStrength, setWifiStrength] = useState(3);
  const [batteryMode, setBatteryMode] = useState<"normal" | "low">("low");
  const [device, setDevice] = useState("iPhone");
  const [period, setPeriod] = useState<"week" | "day">("week");
  const [averageMinutes, setAverageMinutes] = useState(519);
  const [chartMaxHours, setChartMaxHours] = useState(14);
  const [averageAxisLabel, setAverageAxisLabel] = useState("平均");
  const [comparison, setComparison] = useState(13);
  const [socialMinutes, setSocialMinutes] = useState(1728);
  const [creativeMinutes, setCreativeMinutes] = useState(721);
  const [gameMinutes, setGameMinutes] = useState(425);
  const [totalMinutes, setTotalMinutes] = useState(3117);
  const [updatedTime, setUpdatedTime] = useState("21:07");
  const [apps, setApps] = useState(initialApps);
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const rankedApps = useMemo(
    () => apps.map((app, originalIndex) => ({ ...app, originalIndex }))
      .sort((a, b) => b.minutes - a.minutes || a.originalIndex - b.originalIndex),
    [apps],
  );

  const categoryTotal = Math.max(1, socialMinutes + creativeMinutes + gameMinutes);
  const categoryShares = [
    socialMinutes / categoryTotal,
    creativeMinutes / categoryTotal,
    gameMinutes / categoryTotal,
  ];
  const chartMaxMinutes = Math.max(60, chartMaxHours * 60);
  const averagePercent = Math.min(86, Math.max(12, averageMinutes / chartMaxMinutes * 100));
  const averageY = 144 * (1 - averagePercent / 100);

  async function exportPng() {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const images = Array.from(captureRef.current.querySelectorAll("img"));
      await Promise.all(images.map((img) => img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })));
      const canvas = await toCanvas(captureRef.current, {
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        canvasWidth: EXPORT_WIDTH,
        canvasHeight: EXPORT_HEIGHT,
        pixelRatio: 1,
        backgroundColor: "#000000",
        cacheBust: true,
        preferredFontFormat: "woff2",
        skipAutoScale: true,
        style: {
          margin: "0",
          transform: "none",
          transformOrigin: "top left",
        },
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG 生成失败")), "image/png", 1);
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "iphone-15-pro-screen-time-1179x2556.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(error);
      window.alert("截图生成失败，请刷新页面后重试。");
    } finally {
      setExporting(false);
    }
  }

  function updateApp(index: number, minutes: number) {
    setApps((current) => current.map((app, i) => i === index
      ? { ...app, minutes: Math.max(0, Math.min(9999, minutes || 0)) }
      : app));
  }

  return (
    <main className="studio">
      <header className="studio-header">
        <div>
          <span className="kicker">IOS SCREEN TIME STUDIO</span>
          <h1>屏幕时间截图模拟器</h1>
          <p>以最终参考图为唯一基准，导出真实 iPhone 15 Pro 截图尺寸 1179 × 2556。</p>
        </div>
        <button className="top-export" onClick={exportPng} disabled={exporting}>
          {exporting ? "正在生成…" : "导出 PNG"}
        </button>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <PanelTitle number="01" title="状态栏与导航" />
          <div className="field-grid">
            <Field label="状态栏时间"><input type="time" value={statusTime} onChange={(e) => setStatusTime(e.target.value)} /></Field>
            <Field label="设备名称"><input type="text" value={device} maxLength={12} onChange={(e) => setDevice(e.target.value)} /></Field>
          </div>
          <Range label="运行商信号" value={`${signalBars} 格`} min={1} max={4} valueNumber={signalBars} onChange={setSignalBars} />
          <Range label="Wi-Fi 强度" value={`${wifiStrength} 格`} min={1} max={3} valueNumber={wifiStrength} onChange={setWifiStrength} />
          <Range label="电池电量" value={`${battery}%`} min={1} max={100} valueNumber={battery} onChange={setBattery} />
          <div className="battery-mode-control">
            <span>电池模式 <small>真实状态栏图片 · {battery}%</small></span>
            <div>
              <button className={batteryMode === "normal" ? "active" : ""} onClick={() => setBatteryMode("normal")}>正常</button>
              <button className={batteryMode === "low" ? "active low" : ""} onClick={() => setBatteryMode("low")}>低电量</button>
            </div>
          </div>

          <PanelTitle number="02" title="屏幕时间数据" />
          <div className="period-control">
            <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>每周</button>
            <button className={period === "day" ? "active" : ""} onClick={() => setPeriod("day")}>每天</button>
          </div>
          <MinuteInput label="日均屏幕时间" value={averageMinutes} onChange={setAverageMinutes} />
          <div className="field-grid">
            <Field label="图表最高刻度（小时）">
              <input
                type="number"
                min={1}
                max={48}
                value={chartMaxHours}
                onChange={(e) => setChartMaxHours(Math.max(1, Math.min(48, Number(e.target.value) || 1)))}
              />
            </Field>
            <Field label="平均文字">
              <input
                type="text"
                maxLength={8}
                value={averageAxisLabel}
                onChange={(e) => setAverageAxisLabel(e.target.value)}
              />
            </Field>
          </div>
          <Range label="与上周比浮动" value={`${comparison}%`} min={-99} max={99} valueNumber={comparison} onChange={setComparison} />
          <MinuteInput label="社交" value={socialMinutes} onChange={setSocialMinutes} />
          <MinuteInput label="创意" value={creativeMinutes} onChange={setCreativeMinutes} />
          <MinuteInput label="游戏" value={gameMinutes} onChange={setGameMinutes} />
          <MinuteInput label="总屏幕时间" value={totalMinutes} onChange={setTotalMinutes} />
          <Field label="更新时间"><input type="time" value={updatedTime} onChange={(e) => setUpdatedTime(e.target.value)} /></Field>

          <PanelTitle number="03" title="最常使用" />
          <p className="panel-note">时间独立调整，右侧会自动按用量重新排序。</p>
          <div className="app-controls">
            {apps.map((app, index) => (
              <div className="app-control" key={app.name}>
                <img src={app.icon} alt="" />
                <span>{app.name}</span>
                <input
                  aria-label={`${app.name}使用分钟`}
                  type="number"
                  min={0}
                  max={9999}
                  value={app.minutes}
                  onChange={(e) => updateApp(index, Number(e.target.value))}
                />
                <b>{formatMinutes(app.minutes)}</b>
              </div>
            ))}
          </div>
          <button className="main-export" onClick={exportPng} disabled={exporting}>
            {exporting ? "正在生成截图…" : "生成 1179 × 2556 截图"}
          </button>
        </aside>

        <section className="preview-column">
          <div className="preview-heading"><span>最终画布预览</span><span>等比预览 · 导出 1179 × 2556</span></div>
          <div className="screen-viewport">
            <div className="screen-scale">
              <div id="ios-export-canvas" className="ios-screen" ref={captureRef}>
                <div className="status-time-pill">{stripLeadingZero(statusTime)}</div>
                <div className="screen-status-icons">
                  <span className="cellular">
                    {[1, 2, 3, 4].map((level) => <i key={level} className={level <= signalBars ? "on" : ""} />)}
                  </span>
                  <span className={`authentic-status-icon authentic-wifi wifi-strength-${wifiStrength}`} aria-label={`Wi-Fi 强度 ${wifiStrength} 格`}>
                    <img
                      src={wifiStrength === 3
                        ? "/ios17-wifi-full.png"
                        : wifiStrength === 2
                          ? "/ios17-wifi-medium.png"
                          : "/ios17-wifi-weak.png"}
                      alt=""
                    />
                  </span>
                  <span className={`authentic-status-icon authentic-battery ${batteryMode === "low" ? "low-power" : "normal-power"}`} aria-label={`电池电量 ${battery}%，${batteryMode === "low" ? "低电量模式" : "正常模式"}`}>
                    <img
                      src={batteryMode === "low" && battery === 19
                        ? "/ios17-battery-low.png"
                        : `/battery/${batteryMode}-${battery}.png`}
                      alt=""
                    />
                  </span>
                </div>

                <button className="back-button" aria-label="返回"><i /></button>
                <div className="screen-title">{device || "iPhone"}</div>
                <button className="device-button">设备</button>

                <div className="screen-segmented">
                  <button className={period === "week" ? "selected" : ""} onClick={() => setPeriod("week")}>每周</button>
                  <button className={period === "day" ? "selected" : ""} onClick={() => setPeriod("day")}>每天</button>
                </div>

                <h2 className="screen-time-heading">屏幕时间</h2>
                <section className="summary-card">
                  <span className="daily-label">日均</span>
                  <strong className="daily-value">{formatMinutes(averageMinutes)}</strong>
                  <div className="comparison-line">
                    <i>{comparison >= 0 ? "↑" : "↓"}</i>
                    <span>与上周比浮动{Math.abs(comparison)}%</span>
                  </div>

                  <div
                    className="chart"
                    style={{ "--average-y": `${averageY}px` } as CSSProperties}
                  >
                    <div className="chart-grid" />
                    <div className="average-line" />
                    <div className="bars">
                      {dayFactors.map((factor, index) => {
                        const totalHeight = Math.min(94, averageMinutes * factor / chartMaxMinutes * 100);
                        return (
                          <div className="bar-column" key={dayLabels[index]}>
                            <div className="stack" style={{ height: `${totalHeight}%` }}>
                              <i className="social" style={{ height: `${categoryShares[0] * 100}%` }} />
                              <i className="creative" style={{ height: `${categoryShares[1] * 100}%` }} />
                              <i className="games" style={{ height: `${categoryShares[2] * 100}%` }} />
                            </div>
                            <span>{dayLabels[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <span className="axis-top">{chartMaxHours}小时</span>
                    <span className="axis-average">{averageAxisLabel}</span>
                    <span className="axis-bottom">0</span>
                  </div>

                  <div className="category category-social"><span>社交</span><b>{formatMinutes(socialMinutes)}</b></div>
                  <div className="category category-creative"><span>创意</span><b>{formatMinutes(creativeMinutes)}</b></div>
                  <div className="category category-games"><span>游戏</span><b>{formatMinutes(gameMinutes)}</b></div>
                  <div className="card-divider" />
                  <div className="total-row"><span>总屏幕时间</span><b>{formatMinutes(totalMinutes)}</b></div>
                </section>

                <div className="updated-line">更新于：今天 {stripLeadingZero(updatedTime)}</div>
                <div className="most-used-title"><span>最常使用</span><button>显示类别</button></div>
                <section className="usage-card">
                  {rankedApps.map((app, index) => (
                    <div className="usage-row" key={app.name}>
                      <img src={app.icon} alt="" />
                      <div className="usage-main">
                        <div><span>{app.name}</span><b>{formatMinutes(app.minutes)}</b><em /></div>
                        <i style={{ width: `${Math.max(8, app.minutes / Math.max(1, rankedApps[0].minutes) * 100)}%` }} />
                      </div>
                      <span className="chevron" />
                      {index < rankedApps.length - 1 && <div className="usage-divider" />}
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelTitle({ number, title }: { number: string; title: string }) {
  return <div className="panel-title"><span>{number}</span><b>{title}</b></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Range({ label, value, min, max, valueNumber, onChange }: {
  label: string;
  value: string;
  min: number;
  max: number;
  valueNumber: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span>{label}<b>{value}</b></span>
      <input type="range" min={min} max={max} value={valueNumber} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function MinuteInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="minute-field">
      <span>{label}<small>{formatMinutes(value)}</small></span>
      <input type="number" min={0} max={9999} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
      <em>分钟</em>
    </label>
  );
}

function stripLeadingZero(value: string) {
  return value.replace(/^0/, "");
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (!hours) return `${rest}分钟`;
  return `${hours}小时${rest ? `${rest}分钟` : ""}`;
}
