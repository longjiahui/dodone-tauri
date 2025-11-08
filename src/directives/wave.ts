import VWave from "v-wave"
import { Plugin } from "vue"

const waveInstance = VWave.createLocalWaveDirective({
  initialOpacity: 0.1,
  finalOpacity: 0.05,
  dissolveDuration: 0.4,
})
export const waveDirective = waveInstance.wave

export const wavePlugin = {
  install(app) {
    app.directive("wave", waveDirective)
  },
} as Plugin
