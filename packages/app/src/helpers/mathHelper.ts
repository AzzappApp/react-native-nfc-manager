function lerp(min: number, max: number, value: number) {
  return min * (1 - value) + max * value;
}

function invlerp(min: number, max: number, value: number) {
  return clamp((value - min) / (max - min));
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function range(
  baseMin: number,
  baseMax: number,
  rangeMin: number,
  rangeMax: number,
  value: number,
) {
  return lerp(rangeMin, rangeMax, invlerp(baseMin, baseMax, value));
}
