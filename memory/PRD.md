# XOVA AI Mentor Platform - PRD

## Overview
XOVA is an AI mentor platform designed to help students improve skills, prepare for interviews, practice aptitude, receive career guidance, and develop startup ideas. Built as a cross-platform mobile app using React Native (Expo) with a FastAPI backend.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Backend**: FastAPI (Python), MongoDB
- **AI**: Groq API (Llama 3.3 70B Versatile)
- **Voice**: ElevenLabs API (with expo-speech fallback)
- **Auth**: Emergent Google OAuth
- **UI Theme**: Dark Cyberpunk/Futuristic with Neon Cyan (#00F3FF) + Electric Purple (#7B2CBF)

## Character System (NEW)
XOVA features a comprehensive anime character-based mentor system:

### User-Uploaded Characters (Custom)
| Character | Voice | Personality | Description |
|-----------|-------|-------------|-------------|
| Zero Two | Female (Bella) | Playful | Energetic and confident mentor |
| Hinata | Female (Nicole) | Supportive | Gentle and encouraging mentor |
| Mikasa | Female (Charlotte) | Strict | Disciplined and focused mentor |
| Tsunade | Female (Domi) | Teacher | Wise and powerful mentor |
| Suzume | Female (Elli) | Friendly | Adventurous and caring mentor |

### Popular Characters
| Character | Voice | Personality | Description |
|-----------|-------|-------------|-------------|
| Naruto | Male (Josh) | Motivator | "Believe it!" Never give up mentor |
| Luffy | Male (Sam) | Friendly | Adventurous free spirit mentor |
| Goku | Male (Arnold) | Motivator | "Push your limits" mentor |

### Voice System
- Each character has a unique ElevenLabs voice
- Female characters use female voice IDs
- Male characters use male voice IDs  
- Voices have different qualities (warm, energetic, gentle, strong)
- Fallback to expo-speech if ElevenLabs fails

## Screens & Features

### 1. Login Screen
- Google OAuth via Emergent Auth
- Futuristic dark UI with animated logo
- Feature highlights (Aptitude, Voice, Interview, Startup)

### 2. Dashboard (Tab)
- Selected anime character avatar with animations
- AI mentor greeting with user's name
- Daily learning mission with progress bar
- Stats grid (Questions, Accuracy, Topics, Plan)
- Streak counter & credits display
- Quick access module cards (Aptitude, Interview, Career, Startup, Community, Settings)
- Talk to XOVA CTA button

### 3. AI Mentor Chat (Tab)
- Conversational AI with Groq (Llama 3.3 70B)
- Selected character avatar in header
- Character-specific voice responses
- Message history (persisted in MongoDB)
- Quick prompt suggestions
- Credit system (deducts 1 credit per message)
- Typing indicator with character name

### 4. Settings/Character Selection
- Visual character selection grid
- Preview of selected character
- Personality selection (Teacher, Friendly, Motivator, Strict, Supportive)
- Character info (voice type, description)

### 5. Aptitude Learning (Tab)
- 40 topics across 3 categories (Quantitative, Logical, Verbal)
- Search and category filter
- Topic detail screen with questions
- Three difficulty levels (Beginner, Intermediate, Advanced)
- MCQ with A/B/C/D options
- Correct/incorrect feedback with explanations
- Adaptive difficulty system
- AI-generated questions when bank runs low

### 6. Interview Practice
- 4 categories: HR, Technical, Behavioral, Startup
- AI generates interview questions
- Text-based answer submission
- AI evaluation with scores (Clarity, Confidence, Structure, Communication)

### 7. Career Guidance
- 6 career fields (SE, Data Science, AI, Startup, PM, Cybersecurity)
- AI-generated career roadmaps
- 6-month plan with monthly milestones

### 8. Startup Mentor
- Describe startup idea via text input
- AI validation with score (0-100)
- Analysis: Strengths, Challenges, Dev Steps, Marketing, Growth

### 9. Profile (Tab)
- User info (avatar, name, email)
- Plan badge
- Credit usage bar
- Stats (Questions, Accuracy, Streak)
- Subscription plans (Free, Lite, Pro, Year)

## Credit System
| Plan | Credits/Day | Price |
|------|------------|-------|
| Free | 10 | ₹0 |
| Lite | 40 | ₹20/mo |
| Pro | 80 | ₹35/mo |
| Year | Unlimited | ₹349/yr |

## API Endpoints
- `POST /api/auth/session` - Exchange OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/dashboard` - Dashboard data
- `POST /api/chat/send` - Send chat message (includes character_id for voice)
- `GET /api/chat/history` - Chat history
- `DELETE /api/chat/history` - Clear history
- `GET /api/aptitude/topics` - List 40 topics
- `GET /api/aptitude/topics/{id}/questions` - Topic questions
- `POST /api/aptitude/submit` - Submit answer
- `POST /api/interview/question` - Generate question
- `POST /api/interview/evaluate` - Evaluate answer
- `POST /api/career/guidance` - Career roadmap
- `POST /api/startup/advice` - Startup analysis
- `GET /api/user/profile` - User profile
- `PUT /api/user/settings` - Update settings (includes mentor_character)
- `GET /api/user/credits` - Credit info
- `POST /api/user/upgrade` - Upgrade plan (MOCK)
- `POST /api/tts/generate` - Generate TTS audio

## Current Status
✅ Implemented:
- Google Authentication
- AI Chat with Groq API
- ElevenLabs Voice Integration (requires paid key)
- Anime Character Selection System (5 custom + 3 popular)
- Character-specific voices
- Dashboard with character avatar
- Settings screen with character selection
- All core screens (Aptitude, Interview, Career, Startup)
- Credit system
- Futuristic cyberpunk theme

🟡 Partial:
- ElevenLabs voice synthesis (401 error - key needs paid subscription)
- Falls back to expo-speech successfully

❌ Not Yet Implemented:
- Razorpay real payment integration
- Custom character creator (upload your own image)
- 3D animations for characters
- Camera integration for interviews
- Community features

## Next Steps (Priority Order)
1. Razorpay Payment Integration (test mode)
2. Character animations (idle, talking, thinking)
3. Custom mentor creator
4. Interview camera integration
5. Community features
