const { io } = require("socket.io-client");
const { spawn } = require("child_process");

let server;

beforeAll(done => {
  server = spawn("node", ["server.js"]);
  setTimeout(done, 2000); // give server time to start
});

afterAll(() => {
  server.kill();
});

test("driver location is broadcast to rider", done => {
  const rider = io("http://localhost:3000");
  const driver = io("http://localhost:3000");

  rider.emit("join", "ci123");

  rider.on("location_update", data => {
    expect(data.lat).toBe(40.1);
    expect(data.lng).toBe(-83.1);
    rider.disconnect();
    driver.disconnect();
    done();
  });

  driver.emit("driver_location", {
    trackingId: "ci123",
    lat: 40.1,
    lng: -83.1
  });
});
