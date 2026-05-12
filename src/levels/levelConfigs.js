export const levels = [
  {
    id: 'everest',
    name: 'Sagarmatha / Everest',
    region: 'Khumbu',
    elevation: 8848,
    mood: 'Gentle snow, dangerous pride',
    festival: 'Mani Rimdu blessing at Tengboche',
    color: '#7cc6ff',
    sky: '#badcf5',
    routeLength: 180,
    difficulty: 0.82,
    oxygenDrain: 0.72,
    staminaDrain: 0.58,
    wind: 0.45,
    hazards: ['crevasse', 'blizzard'],
    dialogue: [
      { speaker: 'Karma', en: 'Stay on my rope. The summit waits for patient feet.', ne: 'डोरीमा बस। शिखर धैर्य गर्नेका लागि हो।' },
      { speaker: 'Pemba', en: 'The flags are restless today.', ne: 'आज ध्वजाहरू धेरै चञ्चल छन्।' }
    ]
  },
  {
    id: 'annapurna',
    name: 'Annapurna I',
    region: 'Gandaki',
    elevation: 8091,
    mood: 'Beautiful, unstable, fast-changing',
    festival: 'Dashain tika at base camp',
    color: '#ffb15d',
    sky: '#f7d3a2',
    routeLength: 195,
    difficulty: 1.04,
    oxygenDrain: 0.88,
    staminaDrain: 0.72,
    wind: 0.62,
    hazards: ['avalanche', 'crevasse'],
    dialogue: [
      { speaker: 'Karma', en: 'Annapurna gives no warning twice.', ne: 'अन्नपूर्णाले एउटै चेतावनी दुई पटक दिँदैन।' },
      { speaker: 'Maya', en: 'The snow sounds hollow under us.', ne: 'हाम्रो मुनिको हिउँ खोक्रो सुनिन्छ।' }
    ]
  },
  {
    id: 'langtang',
    name: 'Langtang Lirung',
    region: 'Langtang Valley',
    elevation: 7227,
    mood: 'Sacred valley, tight ridgelines',
    festival: 'Losar lanterns in the storm',
    color: '#53d6a8',
    sky: '#a8e8da',
    routeLength: 172,
    difficulty: 0.92,
    oxygenDrain: 0.64,
    staminaDrain: 0.66,
    wind: 0.55,
    hazards: ['spirit', 'blizzard'],
    dialogue: [
      { speaker: 'Karma', en: 'Walk softly. The valley remembers every footstep.', ne: 'बिस्तारै हिँड। उपत्यकाले हरेक पाइला सम्झन्छ।' },
      { speaker: 'Old Lama', en: 'Offer silence before you ask passage.', ne: 'बाटो माग्नुअघि मौन अर्पण गर।' }
    ]
  },
  {
    id: 'manaslu',
    name: 'Manaslu',
    region: 'Gorkha',
    elevation: 8163,
    mood: 'Long endurance, knife-edge weather',
    festival: 'Tihar lamps in a whiteout',
    color: '#d36cff',
    sky: '#c8b4ed',
    routeLength: 205,
    difficulty: 1.18,
    oxygenDrain: 0.94,
    staminaDrain: 0.82,
    wind: 0.72,
    hazards: ['avalanche', 'blizzard', 'crevasse'],
    dialogue: [
      { speaker: 'Karma', en: 'Manaslu tests the team, not the ego.', ne: 'मनास्लुले घमण्ड होइन, टोली जाँच्छ।' },
      { speaker: 'Tashi', en: 'If one slows, all slow.', ne: 'एक जना ढिलो भए, सबै ढिलो हुन्छन्।' }
    ]
  },
  {
    id: 'kanchenjunga',
    name: 'Kanchenjunga',
    region: 'Taplejung',
    elevation: 8586,
    mood: 'Brutal, quiet, meditative',
    festival: 'Sakela drums carried by memory',
    color: '#f4e27a',
    sky: '#ebe3bf',
    routeLength: 220,
    difficulty: 1.28,
    oxygenDrain: 1.02,
    staminaDrain: 0.76,
    wind: 0.5,
    hazards: ['spirit', 'crevasse', 'avalanche'],
    dialogue: [
      { speaker: 'Karma', en: 'We do not conquer this mountain. We are allowed to return.', ne: 'हामी यो हिमाल जित्दैनौं। हामीलाई फर्किन अनुमति मिल्छ।' },
      { speaker: 'Mountain Spirit', en: 'Leave no hurry here.', ne: 'यहाँ हतार नछोड।' }
    ]
  }
];
