test("OSRM returns valid route distance and duration", async () => {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    "-73.985428,40.748817;-73.983300,40.750400?overview=false";

  const res = await fetch(url);
  const json = await res.json();

  expect(json.routes.length).toBeGreaterThan(0);
  expect(json.routes[0].distance).toBeGreaterThan(100);
  expect(json.routes[0].duration).toBeGreaterThan(10);
});
