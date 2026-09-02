const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const getAssistantReply = async (message) => {
  await wait(650);

  const query = message.toLowerCase();

  if (query.includes("voice") || query.includes("audio") || query.includes("clone")) {
    return "Sentinel's Voice Clone Profiler checks audio spectrograms for GAN signature boundaries. Go to 'Upload Audio' to test.";
  }

  if (query.includes("video") || query.includes("deepfake") || query.includes("face")) {
    return "Our Synthetic Video Scanner uses face keypoint trackers and lip-sync calibration checks. Upload video feeds in 'Upload Video'.";
  }

  if (query.includes("live") || query.includes("call") || query.includes("zoom")) {
    return "Live streams can be scanned by connecting SIP VoIP trunks or WebRTC feeds in the 'Live Detection' tab.";
  }

  if (query.includes("score") || query.includes("risk") || query.includes("report")) {
    return "You can synthesize threat scores and get mitigation checklists under the 'Risk Report' page.";
  }

  if (query.includes("pricing") || query.includes("cost") || query.includes("buy")) {
    return "SentinelAI enterprise licenses offer sub-100ms SLA guarantees. Please submit an incident query via 'Contact' for quotes.";
  }

  return "I'm analyzing network parameters for your query. Please refer to our core Upload modules to inspect specific files.";
};

export const getDashboardSummary = async () => {
  await wait(300);

  return {
    securityScore: "98.8%",
    streamsVetted: "1,248",
    interceptionsFlagged: "84",
    nodesOnline: "48 / 48"
  };
};

export const submitContactForm = async (payload) => {
  await wait(400);

  return {
    success: true,
    message: `Secure packet dispatched for ${payload.name || "the requesting team"}.`
  };
};

export const generateRiskReport = async ({ companyName, department }) => {
  await wait(900);

  const grades = ["A-", "B+", "A", "B"];

  return {
    riskGrade: grades[Math.floor(Math.random() * grades.length)],
    reference: `S-AUDIT-${Math.floor(Math.random() * 90000 + 10000)}`,
    summary: {
      companyName,
      department,
      focusAreas: [
        "Voice channel integrity",
        "Video verification resilience",
        "Linguistic coercion detection"
      ]
    }
  };
};
