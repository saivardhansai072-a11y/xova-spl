// Character definitions with images, voices, and personalities
// User-uploaded anime characters + popular characters

export type CharacterType = {
  id: string;
  name: string;
  image: string;
  gender: 'female' | 'male';
  voiceId: string;
  color: string;
  personality: string;
  description: string;
  category: 'custom' | 'popular';
};

// ElevenLabs Voice IDs
export const VOICE_IDS = {
  // Female voices
  rachel: '21m00Tcm4TlvDq8ikWAM',      // Rachel - warm, professional
  bella: 'EXAVITQu4vr4xnSDxMaL',        // Bella - youthful, friendly
  charlotte: 'XB0fDUnXU5powFXDhCwa',    // Charlotte - elegant
  domi: 'AZnzlk1XvdvUeBnXmlld',         // Domi - energetic
  elli: 'MF3mGyEYCl7XYWbV9V6O',         // Elli - emotional
  nicole: 'piTKgcLEGmPE4e6mEKli',       // Nicole - soft, gentle
  sarah: 'EXAVITQu4vr4xnSDxMaL',        // Sarah - confident
  
  // Male voices
  adam: 'pNInz6obpgDQGcFmaJgB',         // Adam - deep, authoritative
  antoni: 'ErXwobaYiN019PkySvjV',       // Antoni - smooth, warm
  arnold: 'VR6AewLTigWG4xSOukaG',       // Arnold - strong, bold
  josh: 'TxGEqnHWrfWFTfGW9XjX',         // Josh - casual, friendly
  sam: 'yoZ06aMxZJJ28mfd3POQ',          // Sam - young, energetic
};

// User uploaded characters
const USER_CHARACTERS: CharacterType[] = [
  {
    id: 'zero_two',
    name: 'Zero Two',
    image: 'https://customer-assets.emergentagent.com/job_1131d4e1-0124-4b6b-ac97-1d4fa53c0af2/artifacts/svdg3t0f_WhatsApp%20Image%202026-03-11%20at%204.36.30%20PM%20%281%29.jpeg',
    gender: 'female',
    voiceId: VOICE_IDS.bella,
    color: '#FF6B9D',
    personality: 'playful',
    description: 'Energetic and confident mentor',
    category: 'custom',
  },
  {
    id: 'hinata',
    name: 'Hinata',
    image: 'https://customer-assets.emergentagent.com/job_1131d4e1-0124-4b6b-ac97-1d4fa53c0af2/artifacts/2o9cr819_WhatsApp%20Image%202026-03-11%20at%204.36.30%20PM.jpeg',
    gender: 'female',
    voiceId: VOICE_IDS.nicole,
    color: '#E6E6FA',
    personality: 'supportive',
    description: 'Gentle and encouraging mentor',
    category: 'custom',
  },
  {
    id: 'mikasa',
    name: 'Mikasa',
    image: 'https://customer-assets.emergentagent.com/job_1131d4e1-0124-4b6b-ac97-1d4fa53c0af2/artifacts/mmto6x4g_WhatsApp%20Image%202026-03-11%20at%204.36.29%20PM%20%283%29.jpeg',
    gender: 'female',
    voiceId: VOICE_IDS.charlotte,
    color: '#8B0000',
    personality: 'strict',
    description: 'Disciplined and focused mentor',
    category: 'custom',
  },
  {
    id: 'tsunade',
    name: 'Tsunade',
    image: 'https://customer-assets.emergentagent.com/job_1131d4e1-0124-4b6b-ac97-1d4fa53c0af2/artifacts/in571q38_WhatsApp%20Image%202026-03-11%20at%204.36.29%20PM%20%282%29.jpeg',
    gender: 'female',
    voiceId: VOICE_IDS.domi,
    color: '#FFD700',
    personality: 'teacher',
    description: 'Wise and powerful mentor',
    category: 'custom',
  },
  {
    id: 'suzume',
    name: 'Suzume',
    image: 'https://customer-assets.emergentagent.com/job_1131d4e1-0124-4b6b-ac97-1d4fa53c0af2/artifacts/x3aiqvf6_WhatsApp%20Image%202026-03-11%20at%204.36.29%20PM%20%281%29.jpeg',
    gender: 'female',
    voiceId: VOICE_IDS.elli,
    color: '#87CEEB',
    personality: 'friendly',
    description: 'Adventurous and caring mentor',
    category: 'custom',
  },
];

// Popular anime characters (using placeholder images - to be replaced with actual)
const POPULAR_CHARACTERS: CharacterType[] = [
  {
    id: 'naruto',
    name: 'Naruto',
    image: 'https://customer-assets.emergentagent.com/job_xova-career-guide/artifacts/wdoq5vng_naruto.jpeg',
    gender: 'male',
    voiceId: VOICE_IDS.josh,
    color: '#FF8C00',
    personality: 'motivator',
    description: 'Believe it! Never give up mentor',
    category: 'popular',
  },
  {
    id: 'luffy',
    name: 'Luffy',
    image: 'https://i.pinimg.com/736x/f3/4f/99/f34f99c1c6d8c4e3c5f1f3b8c5e9f3a0.jpg',
    gender: 'male',
    voiceId: VOICE_IDS.sam,
    color: '#FF0000',
    personality: 'friendly',
    description: 'Adventurous and free spirit mentor',
    category: 'popular',
  },
  {
    id: 'goku',
    name: 'Goku',
    image: 'https://i.pinimg.com/736x/e5/b9/81/e5b981c0e9f1e3f3b1c6d8c4e3c5f1f3.jpg',
    gender: 'male',
    voiceId: VOICE_IDS.arnold,
    color: '#00BFFF',
    personality: 'motivator',
    description: 'Always push your limits mentor',
    category: 'popular',
  },
  {
    id: 'custom',
    name: 'Custom',
    image: '',
    gender: 'female',
    voiceId: VOICE_IDS.rachel,
    color: '#00F3FF',
    personality: 'friendly',
    description: 'Create your own mentor',
    category: 'custom',
  },
];

export const ALL_CHARACTERS = [...USER_CHARACTERS, ...POPULAR_CHARACTERS];

export const getCharacterById = (id: string): CharacterType | undefined => {
  return ALL_CHARACTERS.find(c => c.id === id);
};

export const getCharactersByCategory = (category: 'custom' | 'popular'): CharacterType[] => {
  return ALL_CHARACTERS.filter(c => c.category === category);
};

export const getFemaleCharacters = (): CharacterType[] => {
  return ALL_CHARACTERS.filter(c => c.gender === 'female');
};

export const getMaleCharacters = (): CharacterType[] => {
  return ALL_CHARACTERS.filter(c => c.gender === 'male');
};

// Default character
export const DEFAULT_CHARACTER = USER_CHARACTERS[0]; // Zero Two
