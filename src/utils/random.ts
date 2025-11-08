import SeedRandom from "seed-random"

export function getHSLHash(val: string) {
  let random = SeedRandom(val || "")
  return Math.floor(random() * 361)
}
export function getRandomHue() {
  return Math.floor(Math.random() * 361)
}
