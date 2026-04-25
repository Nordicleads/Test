import { Audio } from "expo-av";
import type { RouteStop } from "@wandr/shared";

let currentSound: Audio.Sound | null = null;

export async function prepareAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
}

export async function playStop(stop: RouteStop): Promise<void> {
  await stopAudio();
  if (!stop.building.audioGuideUrl) return;

  const { sound } = await Audio.Sound.createAsync(
    { uri: stop.building.audioGuideUrl },
    { shouldPlay: true }
  );
  currentSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      currentSound = null;
    }
  });
}

export async function pauseAudio(): Promise<void> {
  await currentSound?.pauseAsync();
}

export async function resumeAudio(): Promise<void> {
  await currentSound?.playAsync();
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}
