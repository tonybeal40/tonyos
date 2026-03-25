export function generateOutreach(account) {
  const painsList = account.pain_points ? 
    (typeof account.pain_points === 'string' ? 
      JSON.parse(account.pain_points).slice(0, 2).join(' and ') : 
      account.pain_points.slice(0, 2).join(' and ')) 
    : 'process optimization and tooling reliability';

  const scientific = `Hi {{name}},

I'm with Natoli Scientific, supporting R&D and scale-up teams.

We often work with groups facing ${painsList}, especially during method transfer and validation.

Happy to share how others approach this if useful.

Best,
Tony`;

  const engineering = `Hi {{name}},

I'm with Natoli Engineering at our headquarters, supporting teams working on tooling and process reliability.

We often help ${account.industry?.toLowerCase() || 'pharmaceutical'} teams address ${painsList}.

If it's helpful, I can connect you with our engineers or scientific group depending on where your focus is.

Best regards,
Tony`;

  const both = `Hi {{name}},

I'm with Natoli, where we support both R&D and production teams with compaction solutions.

Your team in ${account.industry?.toLowerCase() || 'pharma'} likely deals with ${painsList} — we work across the entire lifecycle from formulation development through production scale-up.

Happy to share how others in your space approach these challenges.

Best,
Tony`;

  if (account.division_fit === "Natoli Scientific") {
    return scientific;
  } else if (account.division_fit === "Natoli Engineering") {
    return engineering;
  } else {
    return both;
  }
}

export function generateFollowUp(account, touchNumber = 2) {
  const templates = {
    2: `Hi {{name}},

Just following up on my earlier note. I know ${account.industry || 'pharma'} teams are often stretched thin.

If tooling or formulation challenges come up, we're here to help.

Tony`,
    3: `Hi {{name}},

Third time's a charm? Happy to step back if the timing isn't right.

If you ever need a resource on compaction or tablet tooling, feel free to reach out.

Best,
Tony`
  };

  return templates[touchNumber] || templates[2];
}
