/**
 * Suggests complaint category based on keyword scoring.
 */
export const smartClassifyCategory = (spokenInput = '', contextTitle = '', contextDesc = '') => {
  const combined = `${spokenInput || ''} ${contextTitle || ''} ${contextDesc || ''}`.toLowerCase();

  // Ignore conversational filler phrases
  const isUnknownPhrase = /i\s+do(n't|\s+not)?\s+know|not\s+sure|no\s+idea|dont\s+know|you\s+choose|auto|any/i.test(spokenInput);

  // Keyword lexicons
  const furnitureKeywords = [
    'door', 'opening', 'open', 'close', 'closing', 'jammed', 'stuck', 'lock', 'locked',
    'key', 'latch', 'handle', 'hinge', 'knob', 'bed', 'cot', 'mattress', 'chair',
    'table', 'desk', 'drawer', 'cupboard', 'almirah', 'closet', 'shelf', 'wardrobe',
    'wood', 'carpentry', 'furniture', 'window', 'glass', 'pane', 'curtain', 'rod',
    'mirror', 'board', 'stool', 'bench'
  ];

  const electricityKeywords = [
    'light', 'fan', 'switch', 'socket', 'plug', 'bulb', 'tube', 'tubelight', 'electricity',
    'electric', 'power', 'current', 'shock', 'spark', 'sparking', 'geyser', 'ac', 'cooler',
    'air conditioner', 'wire', 'wiring', 'mcb', 'trip', 'tripped', 'breaker', 'fuse',
    'voltage', 'dark', 'blackout', 'choke', 'heater', 'iron'
  ];

  const plumbingKeywords = [
    'tap', 'pipe', 'water', 'leak', 'leaking', 'leakage', 'drip', 'dripping', 'sink',
    'basin', 'washbasin', 'drain', 'drainage', 'clog', 'clogged', 'blocked', 'blockage',
    'flush', 'toilet', 'commode', 'shower', 'sewage', 'overflow', 'tank', 'geyser pipe',
    'faucet', 'gutter', 'jet spray', 'pipeline', 'choked'
  ];

  const wifiKeywords = [
    'wifi', 'wi-fi', 'internet', 'lan', 'network', 'router', 'cable', 'signal', 'speed',
    'slow net', 'disconnect', 'disconnection', 'ethernet', 'connectivity', 'loading',
    'connection', 'modem', 'ip address', 'ping', 'ssid'
  ];

  const cleanlinessKeywords = [
    'clean', 'cleaning', 'cleanliness', 'dirty', 'dirt', 'dust', 'garbage', 'trash',
    'waste', 'smell', 'stink', 'odor', 'sweep', 'sweeping', 'mop', 'mopping', 'insects',
    'cockroach', 'bugs', 'pest', 'sanitation', 'litter', 'cobweb', 'dustbin', 'washroom dirty'
  ];

  // If user explicitly named a category in speech, prioritize that directly
  if (!isUnknownPhrase && spokenInput) {
    const inputLower = spokenInput.toLowerCase();
    if (inputLower.includes('furniture') || inputLower.includes('carpenter') || inputLower.includes('wood')) return 'FURNITURE';
    if (inputLower.includes('electric') || inputLower.includes('power')) return 'ELECTRICITY';
    if (inputLower.includes('plumb') || inputLower.includes('water')) return 'PLUMBING';
    if (inputLower.includes('wifi') || inputLower.includes('wi-fi') || inputLower.includes('internet')) return 'WIFI';
    if (inputLower.includes('clean')) return 'CLEANLINESS';
    if (inputLower.includes('other')) return 'OTHER';
  }

  // Count matches in the full context
  const scoreCategory = (keywords) => {
    return keywords.reduce((score, kw) => {
      const boundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
      if (boundaryRegex.test(combined)) return score + 3;
      if (combined.includes(kw)) return score + 1;
      return score;
    }, 0);
  };

  const scores = {
    FURNITURE: scoreCategory(furnitureKeywords),
    ELECTRICITY: scoreCategory(electricityKeywords),
    PLUMBING: scoreCategory(plumbingKeywords),
    WIFI: scoreCategory(wifiKeywords),
    CLEANLINESS: scoreCategory(cleanlinessKeywords)
  };

  let bestCat = 'OTHER';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCat = cat;
    }
  }

  // Only assign category if score > 0; otherwise fallback to OTHER (never blindly default to Plumbing)
  return highestScore > 0 ? bestCat : 'OTHER';
};

