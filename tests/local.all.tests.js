const { io } = require("socket.io-client");

const SERVER = "http://localhost:3000";
const MODE = process.argv[2] || "all"; 
// modes: scale | churn | simulate | soak | all

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ===============================
   1️⃣ SOCKET FAN-OUT SCALE TEST
================================ */
async function scaleTest() {
  console.log("\n▶ SCALE TEST");

  const TRACKING_ID = "scale123";
  const RIDER_COUNT = 200;

  let received = 0;
  const riders = [];

  for (let i = 0; i < RIDER_COUNT; i++) {
    const r = io(SERVER, { transports: ["websocket"] });
    r.emit("join", TRACKING_ID);
    r.on("location_update", () => received++);
    riders.push(r);
  }

  const driver = io(SERVER);

  for (let i = 0; i < 20; i++) {
    driver.emit("driver_location", {
      trackingId: TRACKING_ID,
      lat: 40.1 + i * 0.0001,
      lng: -83.1
    });
    await sleep(200);
  }

  await sleep(2000);
  console.log("Scale test received updates:", received);

  driver.disconnect();
  riders.forEach(r => r.disconnect());
}

/* ===============================
   2️⃣ CONNECTION CHURN TEST
================================ */
async function churnTest() {
  console.log("\n▶ CHURN TEST");

  const TRACKING_ID = "churn123";

  for (let cycle = 1; cycle <= 5; cycle++) {
    const riders = [];

    for (let i = 0; i < 50; i++) {
      const r = io(SERVER);
      r.emit("join", TRACKING_ID);
      riders.push(r);
    }

    await sleep(2000);
    riders.forEach(r => r.disconnect());

    console.log(`Churn cycle ${cycle} complete`);
    await sleep(1000);
  }
}

/* ===============================
   3️⃣ DRIVER SIMULATION TEST
================================ */
async function simulateDriver() {
  console.log("\n▶ DRIVER SIMULATION");

  const TRACKING_ID = "sim123";
  const path = [
    [40.748817, -73.985428],
    [40.749300, -73.984900],
    [40.749900, -73.984200],
    [40.750400, -73.983300],
    [40.751000, -73.982600]
  ];

  const driver = io(SERVER);
  driver.emit("join", TRACKING_ID);

  for (const p of path) {
    driver.emit("driver_location", {
      trackingId: TRACKING_ID,
      lat: p[0],
      lng: p[1]
    });
    console.log("Driver moved to", p);
    await sleep(2000);
  }

  driver.disconnect();
}

/* ===============================
   4️⃣ SOAK TEST
================================ */
async function soakTest() {
  console.log("\n▶ SOAK TEST (10 min)");

  const TRACKING_ID = "soak123";
  const driver = io(SERVER);
  driver.emit("join", TRACKING_ID);

  let lat = 40.0;

  for (let i = 1; i <= 600; i++) {
    lat += 0.00005;

    driver.emit("driver_location", {
      trackingId: TRACKING_ID,
      lat,
      lng: -83.0
    });

    if (i % 60 === 0) {
      console.log(`Soak minute ${i / 60}`);
    }

    await sleep(1000);
  }

  driver.disconnect();
}

/* ===============================
   RUNNER
================================ */
(async () => {
  console.log("Local test mode:", MODE);

  if (MODE === "scale" || MODE === "all") await scaleTest();
  if (MODE === "churn" || MODE === "all") await churnTest();
  if (MODE === "simulate" || MODE === "all") await simulateDriver();
  if (MODE === "soak" || MODE === "all") await soakTest();

  console.log("\n✅ Local tests completed");
  process.exit(0);
})();
