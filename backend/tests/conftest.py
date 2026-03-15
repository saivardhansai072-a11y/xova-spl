import pytest
import requests
import os

@pytest.fixture
def base_url():
    """Public backend URL"""
    return os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://xova-ai-mentor-1.preview.emergentagent.com')

@pytest.fixture
def test_session_token():
    """Test session token for authenticated requests"""
    return "test_session_xova_123"

@pytest.fixture
def api_client(base_url, test_session_token):
    """Authenticated API client with session token"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {test_session_token}"
    })
    session.base_url = base_url
    return session

@pytest.fixture
def api_client_no_auth(base_url):
    """Unauthenticated API client"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    session.base_url = base_url
    return session
