export function withMood(prompt, mood){
  const moodLine = mood === "happy"
    ? "Tone: upbeat, confident, encouraging"
    : mood === "sad"
    ? "Tone: calm, empathetic, slightly heavy"
    : mood === "mad"
    ? "Tone: blunt, impatient with excuses, still helpful"
    : "Tone: neutral, crisp";

  return `${moodLine}\n\n${prompt}`;
}
