import fs from "node:fs";

const appUrl = process.argv[2] ?? "http://127.0.0.1:5180/";
const cdpUrl = process.argv[3] ?? "http://127.0.0.1:9223";

const target = await fetch(`${cdpUrl}/json/new?${encodeURIComponent(appUrl)}`, {
  method: "PUT"
}).then((res) => res.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleEntries = [];
const networkFailures = [];
let callId = 0;

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }

  if (msg.method === "Runtime.consoleAPICalled") {
    consoleEntries.push({
      type: msg.params.type,
      text: msg.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ")
    });
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleEntries.push({
      type: "exception",
      text: [
        msg.params.exceptionDetails?.text,
        msg.params.exceptionDetails?.exception?.description,
        msg.params.exceptionDetails?.url
      ].filter(Boolean).join(" | ") || "exception"
    });
  }
  if (msg.method === "Log.entryAdded") {
    consoleEntries.push({
      type: msg.params.entry.level,
      text: msg.params.entry.text
    });
  }
  if (msg.method === "Network.loadingFailed") {
    networkFailures.push({
      requestId: msg.params.requestId,
      errorText: msg.params.errorText,
      canceled: msg.params.canceled
    });
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  callId += 1;
  ws.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(callId, { resolve, reject });
  });
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false
});

await send("Page.navigate", { url: appUrl });
await sleep(Number(process.env.VERIFY_WAIT_MS ?? 45000));

const before = await evalJson(`(() => {
  const canvas = document.querySelector('.cesium-widget canvas');
  const status = document.querySelector('[aria-label="Viewer status"]')?.innerText || '';
  const data = document.querySelector('[aria-label="PLATEAU data source"]')?.innerText || '';
  const selected = document.querySelector('[aria-label="Selected building"]')?.innerText || '';
  return {
    title: document.title,
    hasCanvas: Boolean(canvas),
    canvasSize: canvas ? { width: canvas.clientWidth, height: canvas.clientHeight } : null,
    webgl: (() => {
      try { return Boolean(canvas?.getContext('webgl2') || canvas?.getContext('webgl')); }
      catch { return false; }
    })(),
    status,
    data,
    selected,
    heapMb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null
  };
})()`);

await send("Input.dispatchMouseEvent", {
  type: "mousePressed",
  x: 720,
  y: 500,
  button: "left",
  clickCount: 1
});
await send("Input.dispatchMouseEvent", {
  type: "mouseReleased",
  x: 720,
  y: 500,
  button: "left",
  clickCount: 1
});
await sleep(2500);

const after = await evalJson(`(() => ({
  status: document.querySelector('[aria-label="Viewer status"]')?.innerText || '',
  selected: document.querySelector('[aria-label="Selected building"]')?.innerText || '',
  heapMb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null
}))()`);

const screenshot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false
});
const screenshotPath = "docs/phase1a-browser-screenshot.png";
fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

await send("Page.close").catch(() => undefined);
ws.close();

const majorErrors = consoleEntries.filter((entry) => {
  const text = String(entry.text);
  if (text.includes("favicon.ico")) return false;
  return ["error", "exception"].includes(String(entry.type));
});

console.log(JSON.stringify({ before, after, majorErrors, networkFailures: networkFailures.slice(0, 30), screenshotPath }, null, 2));

async function evalJson(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true
  });
  return result.result.value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
