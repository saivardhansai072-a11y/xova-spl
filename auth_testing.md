# Auth-Gated App Testing Playbook for XOVA

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: '',
  plan: 'free',
  credits_used_today: 0,
  last_credit_reset: '',
  mentor_personality: 'friendly',
  mentor_voice: 'female',
  mentor_style: 'cyberpunk',
  streak: 3,
  last_active_date: '',
  total_questions_answered: 15,
  total_correct: 12,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend APIs
```bash
# Test auth
curl -X GET "https://xova-ai-mentor-1.preview.emergentagent.com/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test dashboard
curl -X GET "https://xova-ai-mentor-1.preview.emergentagent.com/api/dashboard" -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test aptitude topics
curl -X GET "https://xova-ai-mentor-1.preview.emergentagent.com/api/aptitude/topics" -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test chat
curl -X POST "https://xova-ai-mentor-1.preview.emergentagent.com/api/chat/send" -H "Authorization: Bearer YOUR_SESSION_TOKEN" -H "Content-Type: application/json" -d '{"message": "Hello XOVA"}'
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "xova-career-guide.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://xova-ai-mentor-1.preview.emergentagent.com")
```
