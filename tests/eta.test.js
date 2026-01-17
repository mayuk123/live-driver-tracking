function calculateETA(distanceKm, speedKmh) {
  return (distanceKm / speedKmh) * 60;
}

test("ETA decreases as distance decreases", () => {
  const etaFar = calculateETA(5, 30);
  const etaNear = calculateETA(2, 30);

  expect(etaNear).toBeLessThan(etaFar);
});
