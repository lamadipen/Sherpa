export const LEVEL_CONFIGS = [
  {
    id: 0,
    name: 'Langtang',
    nepaliName: 'लाङटाङ',
    elevation: 7227,
    difficulty: 1,
    difficultyLabel: 'Beginner',
    region: 'Langtang National Park',
    description: 'The valley of glaciers. Your first real test as a guide — lead a family of trekkers through the sacred Langtang Valley where yaks roam freely and rhododendrons bloom.',
    storyIntro: 'Spring, 2024. A Japanese family has hired you for their dream trek. The valley is alive with the Yak Festival. But ancient stones at the glacier whisper of spirits disturbed.',
    summaryQuote: '"The mountain does not care how strong you are. It cares how wise you are." — Pasang Sherpa, 1987',
    culturalEvent: 'Yak Festival',
    season: 'Spring',
    skyColor: { r: 0.4, g: 0.6, b: 0.9 },
    fogColor: { r: 0.7, g: 0.8, b: 0.9 },
    fogDensity: 0.01,
    snowIntensity: 0.2,
    windStrength: 0.3,
    sections: [
      { id: 'base_camp', label: 'Langtang Village', altitude: 3430, platforms: 8, hazards: [], weather: 'clear' },
      { id: 'approach', label: 'Glacier Approach', altitude: 4800, platforms: 12, hazards: ['rockfall'], weather: 'light_snow' },
      { id: 'snowfield', label: 'Lirung Glacier', altitude: 5900, platforms: 10, hazards: ['crevasse'], weather: 'snow' },
      { id: 'summit_push', label: 'Summit Ridge', altitude: 7000, platforms: 8, hazards: ['avalanche'], weather: 'storm' },
      { id: 'summit', label: 'Langtang Lirung Summit', altitude: 7227, platforms: 3, hazards: [], weather: 'clear' }
    ],
    spirits: [
      { name: 'Glacier Guardian', triggerAltitude: 5900, dialogue: 'तिमीले हाम्रो हिउँलाई किन अपवित्र पारिरहेछौ?' }
    ],
    music: 'langtang_theme',
    ambientSounds: ['wind_light', 'yak_bells', 'prayer_flags'],
    rewards: { outfit: 'spring_sherpa', badge: 'first_summit' }
  },
  {
    id: 1,
    name: 'Manaslu',
    nepaliName: 'मनास्लु',
    elevation: 8163,
    difficulty: 2,
    difficultyLabel: 'Intermediate',
    region: 'Gorkha District',
    description: 'Mountain of the Spirit. Eight-thousander shrouded in legend. A corporate trekking group arrives with expensive gear but zero respect for the mountain.',
    storyIntro: 'Autumn, 2024. On this peak your father vanished in 1987. His ghost has been seen at altitude. A researcher in your party knows something about what really happened.',
    summaryQuote: '"Manaslu does not give summits. It grants them — to those who are worthy." — Ancient Saying',
    culturalEvent: 'Harvest Festival',
    season: 'Autumn',
    skyColor: { r: 0.3, g: 0.4, b: 0.7 },
    fogColor: { r: 0.5, g: 0.5, b: 0.6 },
    fogDensity: 0.015,
    snowIntensity: 0.5,
    windStrength: 0.6,
    sections: [
      { id: 'base_camp', label: 'Samagaon Base', altitude: 3520, platforms: 8, hazards: [], weather: 'clear' },
      { id: 'icefall', label: 'Thulagi Glacier Icefall', altitude: 5100, platforms: 14, hazards: ['crevasse', 'ice_collapse'], weather: 'light_snow' },
      { id: 'camp2', label: 'Camp II Traverse', altitude: 6400, platforms: 12, hazards: ['rockfall', 'high_wind'], weather: 'snow' },
      { id: 'death_zone', label: 'North Col', altitude: 7800, platforms: 10, hazards: ['avalanche', 'altitude_sickness'], weather: 'storm' },
      { id: 'summit', label: 'Manaslu Summit', altitude: 8163, platforms: 4, hazards: ['spirit_encounter'], weather: 'calm' }
    ],
    spirits: [
      { name: 'Pasang\'s Echo', triggerAltitude: 7000, dialogue: 'छोरा... पर्खनु। म तहाँ छु।' },
      { name: 'Spirit of Manaslu', triggerAltitude: 8000, dialogue: 'के तिम्रो हृदय शुद्ध छ?' }
    ],
    music: 'manaslu_theme',
    ambientSounds: ['wind_medium', 'rockfall_distant', 'prayer_drums'],
    rewards: { outfit: 'autumn_guide', badge: 'spirit_seeker' }
  },
  {
    id: 2,
    name: 'Annapurna',
    nepaliName: 'अन्नपूर्णा',
    elevation: 8091,
    difficulty: 3,
    difficultyLabel: 'Advanced',
    region: 'Annapurna Massif',
    description: 'The deadliest 8000m peak by fatality rate. A supernatural blizzard is brewing. You must reach and seal an ancient spiritual rift before it swallows the entire massif.',
    storyIntro: 'Monsoon, 2024. The other Sherpa families are evacuating. Spirit storms are intensifying. Your group is split — half want to retreat, half push on. The rift must be closed.',
    summaryQuote: '"Annapurna demands everything. She is not a mountain. She is a goddess." — French Climber Lachenal, 1950',
    culturalEvent: 'Dashain Blessing',
    season: 'Monsoon',
    skyColor: { r: 0.2, g: 0.25, b: 0.4 },
    fogColor: { r: 0.3, g: 0.35, b: 0.45 },
    fogDensity: 0.025,
    snowIntensity: 0.8,
    windStrength: 1.2,
    sections: [
      { id: 'base_camp', label: 'Annapurna Base Camp', altitude: 4130, platforms: 8, hazards: [], weather: 'cloudy' },
      { id: 'sanctuary', label: 'Annapurna Sanctuary', altitude: 5500, platforms: 12, hazards: ['rockfall', 'high_wind'], weather: 'monsoon_rain' },
      { id: 'dutch_rib', label: 'Dutch Rib', altitude: 6500, platforms: 14, hazards: ['ice_collapse', 'crevasse'], weather: 'storm' },
      { id: 'summit_ridge', label: 'Northeast Ridge', altitude: 7800, platforms: 10, hazards: ['avalanche', 'whiteout'], weather: 'blizzard' },
      { id: 'summit', label: 'Annapurna I Summit', altitude: 8091, platforms: 4, hazards: ['spirit_rift'], weather: 'supernatural' }
    ],
    spirits: [
      { name: 'Annapurna Devi', triggerAltitude: 7500, dialogue: 'यो आँधी रोक्न सक्छौ? प्रमाण गर।', bossType: 'storm' }
    ],
    music: 'annapurna_theme',
    ambientSounds: ['wind_heavy', 'thunder_distant', 'monsoon_rain'],
    rewards: { outfit: 'storm_sherpa', badge: 'rift_sealer' }
  },
  {
    id: 3,
    name: 'Everest',
    nepaliName: 'सगरमाथा',
    elevation: 8849,
    difficulty: 4,
    difficultyLabel: 'Expert',
    region: 'Khumbu, Solukhumbu',
    description: 'Sagarmatha. The highest point on Earth. The Death Zone above 8000m where your body consumes itself. Face the Hillary Step, the Khumbu Icefall, and the spirit of the mountain itself.',
    storyIntro: 'Winter, 2024. An international media team wants the first livestreamed summit. Your father\'s spirit appears at Camp IV and reveals the truth about his disappearance — and the location of the Sky Road.',
    summaryQuote: '"It is not the mountain we conquer, but ourselves." — Sir Edmund Hillary',
    culturalEvent: 'Mani Rimdu Festival',
    season: 'Winter',
    skyColor: { r: 0.1, g: 0.15, b: 0.3 },
    fogColor: { r: 0.15, g: 0.2, b: 0.35 },
    fogDensity: 0.03,
    snowIntensity: 1.0,
    windStrength: 1.8,
    sections: [
      { id: 'khumbu_icefall', label: 'Khumbu Icefall', altitude: 5400, platforms: 16, hazards: ['ice_collapse', 'crevasse'], weather: 'clear' },
      { id: 'cwm', label: 'Western Cwm', altitude: 6500, platforms: 12, hazards: ['whiteout', 'avalanche'], weather: 'light_snow' },
      { id: 'lhotse_face', label: 'Lhotse Face', altitude: 7200, platforms: 14, hazards: ['rockfall', 'high_wind'], weather: 'snow' },
      { id: 'death_zone', label: 'Death Zone', altitude: 8300, platforms: 12, hazards: ['altitude_sickness', 'hypoxia', 'hallucination'], weather: 'extreme_cold' },
      { id: 'hillary_step', label: 'Hillary Step', altitude: 8790, platforms: 6, hazards: ['spirit_encounter'], weather: 'calm' },
      { id: 'summit', label: 'Sagarmatha Summit', altitude: 8849, platforms: 2, hazards: [], weather: 'clear' }
    ],
    spirits: [
      { name: 'Pasang Sherpa', triggerAltitude: 8300, dialogue: 'म यहाँ छु, छोरा। सत्य थाहा पाउने समय आयो।', bossType: 'revelation' },
      { name: 'Sagarmatha Herself', triggerAltitude: 8800, dialogue: 'अन्तिम परीक्षा।', bossType: 'wind_wall' }
    ],
    music: 'everest_theme',
    ambientSounds: ['wind_extreme', 'oxygen_hiss', 'heartbeat'],
    rewards: { outfit: 'death_zone_suit', badge: 'roof_of_world' }
  },
  {
    id: 4,
    name: 'Kanchenjunga',
    nepaliName: 'कञ्चनजङ्घा',
    elevation: 8586,
    difficulty: 3,
    difficultyLabel: 'Meditative',
    region: 'Eastern Nepal / Sikkim Border',
    description: 'The Sacred One. By tradition, its summit is not climbed — climbers stop one step short to honour the mountain deity. Your goal is not the summit, but a hidden cave where the Sky Road ritual must be performed.',
    storyIntro: 'Late 2024. The spirit storms are breaking Nepal apart. The Sky Road ritual at Kanchenjunga\'s sacred cave is humanity\'s last chance. Your father\'s spirit will guide you — but you must release him to the mountain.',
    summaryQuote: '"Kanchenjunga has never been truly summited, and never will be. It belongs to the gods." — Nima Tenzin, Elder Sherpa',
    culturalEvent: 'Losar (New Year)',
    season: 'Late Autumn',
    skyColor: { r: 0.35, g: 0.45, b: 0.65 },
    fogColor: { r: 0.5, g: 0.6, b: 0.7 },
    fogDensity: 0.008,
    snowIntensity: 0.6,
    windStrength: 0.5,
    sections: [
      { id: 'base_camp', label: 'Ghunsa Valley', altitude: 3595, platforms: 8, hazards: [], weather: 'clear' },
      { id: 'approach', label: 'Ramtang Glacier', altitude: 5200, platforms: 12, hazards: ['crevasse'], weather: 'light_snow' },
      { id: 'spiritual_path', label: 'Path of Ancestors', altitude: 6500, platforms: 14, hazards: ['spirit_visions'], weather: 'mystical' },
      { id: 'sacred_ridge', label: 'Sacred Ridge', altitude: 7800, platforms: 10, hazards: ['high_wind'], weather: 'clear' },
      { id: 'ritual_cave', label: 'Sky Road Cave', altitude: 8530, platforms: 6, hazards: ['final_spirit'], weather: 'supernatural' }
    ],
    spirits: [
      { name: 'Pasang (Final)', triggerAltitude: 7500, dialogue: 'यो अन्तिम यात्रा हो। मलाई जान दे।', bossType: 'farewell' },
      { name: 'Five Treasures God', triggerAltitude: 8400, dialogue: 'पाँच खजानाको संरक्षक — तिमी योग्य छौ?', bossType: 'final_boss' }
    ],
    music: 'kanchenjunga_theme',
    ambientSounds: ['wind_sacred', 'tibetan_bowls', 'chanting'],
    rewards: { outfit: 'sacred_sherpa', badge: 'sky_road_keeper' },
    isLastLevel: true,
    endingType: 'meditative'
  }
];

export const LEADERBOARD_SAMPLE = [
  { name: 'Kami Dorje', time: 892000, score: 9850, summits: 5 },
  { name: 'Tenzing Norbu', time: 934000, score: 9720, summits: 5 },
  { name: 'Ang Phurba', time: 1102000, score: 9100, summits: 4 },
  { name: 'Dawa Yangzum', time: 1245000, score: 8750, summits: 4 },
  { name: 'Pemba Chhiring', time: 1387000, score: 8200, summits: 3 }
];
