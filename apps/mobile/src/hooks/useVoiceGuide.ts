import { useVoiceGuideStore } from "../stores/voiceGuideStore";
import { startGeofencing, stopGeofencing } from "../services/geofenceManager";
import { prepareAudio, playStop, pauseAudio, resumeAudio, stopAudio } from "../services/audioGuide";
import { defineGeofenceTask } from "../tasks/geofenceTask";
import type { RouteStop } from "@wandr/shared";

defineGeofenceTask((event) => {
  const store = useVoiceGuideStore.getState();
  const stop = store.routeStops.find((s) => s.order === event.stopOrder);
  if (stop) {
    store.setCurrentStop(event.stopOrder);
    playStop(stop).catch(() => {});
  }
});

export function useVoiceGuide() {
  const store = useVoiceGuideStore();

  const startGuide = async (stops: RouteStop[]) => {
    await prepareAudio();
    store.startGuide(stops);
    await startGeofencing(stops);
    if (stops[0]) await playStop(stops[0]);
  };

  const stopGuide = async () => {
    await stopGeofencing();
    await stopAudio();
    store.stopGuide();
  };

  const togglePause = async () => {
    if (store.isPlaying) {
      await pauseAudio();
      store.setPlaying(false);
    } else {
      await resumeAudio();
      store.setPlaying(true);
    }
  };

  return { startGuide, stopGuide, togglePause, state: store };
}
