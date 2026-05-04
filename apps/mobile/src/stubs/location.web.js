// Web shim for expo-location — uses browser navigator.geolocation
const Accuracy = { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 };

async function requestForegroundPermissionsAsync() {
  // Browser will prompt automatically on getCurrentPosition; just return granted.
  return { status: "granted" };
}

async function getCurrentPositionAsync(_options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          },
          timestamp: pos.timestamp,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}

module.exports = { requestForegroundPermissionsAsync, getCurrentPositionAsync, Accuracy };
