# XOVA AI Mentor Platform - PRD

## Overview
XOVA is an AI mentor platform designed to help students improve skills, prepare for interviews, practice aptitude, receive career guidance, and develop startup ideas. Built as a cross-platform mobile app using React Native (Expo) with a FastAPI backend.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Backend**: FastAPI (Python), MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key (emergentintegrations library)
- **Auth**: Emergent Google OAuth
- **Voice**: expo-speech (TTS)
- **UI Theme**: Dark Cyberpunk/Jarvis with Neon Cyan (#00F3FF) + Electric Purple (#7B2CBF)

## Screens & Features

### 1. Login Screen
- Google OAuth via Emergent Auth
- Futuristic dark UI with animated logo
- Feature highlights (Aptitude, Voice, Interview, Startup)

### 2. Dashboard (Tab)
- AI mentor greeting with user's name
- Daily learning mission with progress bar
- Stats grid (Questions, Accuracy, Topics, Plan)
- Streak counter & credits display
- Quick access module cards (Aptitude, Interview, Career, Startup, Community, Settings)
- Talk to XOVA CTA button

### 3. AI Mentor Chat (Tab)
- Conversational AI with GPT-5.2
- Message history (persisted in MongoDB)
- Text-to-Speech on AI responses (expo-speech)
- Mentor personality adapts based on settings
- Credit system (deducts 1 credit per message)
- Empty state with welcome message

### 4. Aptitude Learning (Tab)
- 40 topics across 3 categories (Quantitative, Logical, Verbal)
- Search and category filter
- Topic detail screen with questions
- Three difficulty levels (Beginner, Intermediate, Advanced)
- MCQ with A/B/C/D options
- Correct/incorrect feedback with explanations
- Adaptive difficulty system
- AI-generated questions when bank runs low
- Score tracking per session

### 5. Interview Practice
- 4 categories: HR, Technical, Behavioral, Startup
- AI generates interview questions
- Text-based answer submission
- AI evaluation with scores (Clarity, Confidence, Structure, Communication)
- Strengths and improvement suggestions

### 6. Career Guidance
- 6 career fields (SE, Data Science, AI, Startup, PM, Cybersecurity)
- AI-generated career roadmaps
- 6-month plan with monthly milestones
- Required skills and resources

### 7. Startup Mentor
- Describe startup idea via text input
- AI validation with score (0-100)
- Analysis: Strengths, Challenges, Dev Steps, Marketing, Growth

### 8. Profile (Tab)
- User info (avatar, name, email)
- Plan badge
- Credit usage bar
- Stats (Questions, Accuracy, Streak)
- Subscription plans (Free, Lite ₹20/mo, Pro ₹35/mo, Year ₹349/yr)
- **MOCK**: Plan upgrade is instant without real payment

### 9. Settings
- Mentor Personality (Teacher, Friendly, Motivator, Strict, Startup Coach, Supportive)
- Mentor Voice (Female, Male)
- Mentor Style (Cyberpunk, Anime, Jarvis)

### 10. Community (Placeholder)
- Coming Soon with feature preview

## Credit System
| Plan | Credits/Day | Price |
|------|------------|-------|
| Free | 10 | ₹0 |
| Lite | 40 | ₹20/mo |
| Pro | 80 | ₹35/mo |
| Year | Unlimited | ₹349/yr |

Credits reset every 24 hours. Each AI interaction costs 1 credit.

## API Endpoints
- `POST /api/auth/session` - Exchange OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/dashboard` - Dashboard data
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Chat history
- `DELETE /api/chat/history` - Clear history
- `GET /api/aptitude/topics` - List 40 topics
- `GET /api/aptitude/topics/{id}/questions` - Topic questions
- `POST /api/aptitude/submit` - Submit answer
- `GET /api/aptitude/progress` - User progress
- `POST /api/interview/question` - Generate question
- `POST /api/interview/evaluate` - Evaluate answer
- `POST /api/career/guidance` - Career roadmap
- `POST /api/startup/advice` - Startup analysis
- `GET /api/user/profile` - User profile
- `PUT /api/user/settings` - Update settings
- `GET /api/user/credits` - Credit info
- `POST /api/user/upgrade` - Upgrade plan (MOCK)

## Mocked Features
- Payment system: Plan upgrade is instant without real payment processing
- Community: Placeholder with "Coming Soon" message
- 3D Mentor Avatar: Represented as icon-based avatar (not 3D model)
- Camera integration in interviews: Not yet implemented

## Next Steps
- Implement real Google Play Billing for subscriptions
- Build community discussion rooms with real-time messaging
- Add 3D mentor avatar with animations (Lottie or Three.js)
- Implement Speech-to-Text for voice input
- Add learning streak notifications
- Implement custom mentor creator with image upload
