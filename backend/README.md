# Snabb Mobile Backend

Independent FastAPI backend for the Snabb mobile application.

## Features

- User authentication with JWT tokens
- Ask management (create, read, update, delete)
- Response/bidding system
- SQLite database
- RESTful API with automatic documentation

## Setup

### 1. Create Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Seed Database (Optional)

```powershell
python seed_data.py
```

This creates test users:
- Username: `john_doe`, Password: `password123`
- Username: `jane_smith`, Password: `password123`
- Username: `bob_wilson`, Password: `password123`

### 4. Run Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update user profile

### Asks
- `GET /asks` - List all asks
- `GET /asks/{id}` - Get ask details
- `POST /asks` - Create new ask (requires auth)
- `PUT /asks/{id}` - Update ask (requires auth)
- `DELETE /asks/{id}` - Delete ask (requires auth)
- `GET /asks/my` - Get user's asks (requires auth)
- `POST /asks/{id}/close` - Close ask (requires auth)

### Responses
- `GET /responses/asks/{ask_id}/responses` - Get responses for ask
- `POST /responses/asks/{ask_id}/responses` - Create response (requires auth)
- `GET /responses/my` - Get user's responses (requires auth)
- `POST /responses/{id}/accept` - Accept response (requires auth)
- `DELETE /responses/{id}` - Delete response (requires auth)

## Database

The backend uses SQLite with the following models:

- **User**: username, email, password, phone, location
- **Ask**: title, description, category, location, budget, status
- **Response**: message, bid_amount, is_accepted

## Development

### Running Tests
```powershell
pytest
```

### Database Reset
Delete `snabb.db` file and run `seed_data.py` again.

## Production Deployment

1. Change `SECRET_KEY` in `app/auth.py`
2. Use PostgreSQL instead of SQLite
3. Set up proper CORS origins
4. Use environment variables for configuration
5. Enable HTTPS
6. Set up proper logging

## License

Proprietary - Snabb Mobile App
