export function truthifyPrompt(prompt){
  const rules = [
    "If you cannot verify something, say so explicitly.",
    "Cite sources when making factual claims.",
    "Distinguish between opinion and fact.",
    "When uncertain, admit uncertainty."
  ].join(" ");

  return `[TRUTH POLICY: ${rules}]\n\n${prompt}`;
}
