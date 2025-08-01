# 🚀 AI SQL Assistant Backend

A powerful FastAPI-based backend service that converts natural language queries into SQL using advanced AI models. This backend provides secure query execution, schema management, and intelligent chat assistance.

## 🏗️ Architecture

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/          # API endpoint implementations
│   │   │   ├── nlp.py         # Natural language processing
│   │   │   ├── query.py       # SQL query execution
│   │   │   ├── schema.py      # Schema management
│   │   │   ├── chat.py        # Chat interface
│   │   │   └── suggestions.py # Query suggestions
│   │   └── router.py          # Main API router
│   ├── core/
│   │   ├── config.py          # Configuration management
│   │   └── logger.py          # Logging setup
│   ├── models/                # Database models (SQLAlchemy)
│   ├── schemas/               # Pydantic schemas
│   │   ├── nlp.py            # NLP-related schemas
│   │   ├── query.py          # Query-related schemas
│   │   ├── schema.py         # Schema-related schemas
│   │   ├── chat.py           # Chat-related schemas
│   │   └── suggestions.py    # Suggestion schemas
│   ├── services/              # Business logic services
│   │   ├── nlp_service.py    # AI/ML processing
│   │   ├── query_service.py  # Query execution
│   │   ├── schema_service.py # Schema management
│   │   ├── chat_service.py   # Chat processing
│   │   └── suggestions_service.py # Suggestions
│   └── utils/                 # Utility functions
├── tests/                     # Test files
├── data/                      # Data storage (SQLite, vector DB)
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── main.py                   # FastAPI application entry point
```

## 🌟 Features

### 🤖 AI-Powered Natural Language Processing
- **GPT-4 Integration**: Uses OpenAI's GPT-4 for sophisticated language understanding
- **Intent Recognition**: Automatically detects user intent (SELECT, INSERT, UPDATE, etc.)
- **Entity Extraction**: Identifies tables, columns, values, and operators
- **Context Awareness**: Maintains conversation history for better understanding

### 🔒 Secure Query Execution
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **Query Validation**: Pre-execution validation and safety checks
- **Access Control**: User-based permissions and rate limiting
- **Audit Logging**: Complete query execution tracking

### 📊 Schema Management
- **Schema Upload**: Support for SQL DDL files
- **Automatic Introspection**: Extract table relationships and metadata
- **Vector Embeddings**: Schema caching with semantic search
- **Version Control**: Track schema changes over time

### 💬 Intelligent Chat Interface
- **Conversational AI**: Natural conversation flow with context
- **Multi-turn Dialogues**: Maintain conversation state
- **Clarification Requests**: Ask for more details when needed
- **Action Suggestions**: Propose follow-up queries

### 🚀 Performance & Scalability
- **Async Processing**: FastAPI with async/await support
- **Caching**: Redis-based query and schema caching
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: Prevent abuse and ensure fair usage

## 🛠️ Technology Stack

### Core Framework
- **FastAPI**: Modern, high-performance web framework
- **Uvicorn**: ASGI server for production deployment
- **Pydantic**: Data validation and serialization

### AI/ML Integration
- **OpenAI GPT-4**: Primary language model for NL to SQL conversion
- **LangChain**: AI application framework for complex workflows
- **Sentence Transformers**: Text embeddings for semantic search
- **ChromaDB**: Vector database for schema embeddings

### Database & Storage
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migration management
- **PostgreSQL**: Primary database (with SQLite for development)
- **Redis**: Caching and session storage

### Security & Monitoring
- **Python-JOSE**: JWT token handling
- **Passlib**: Password hashing
- **Prometheus**: Metrics collection
- **Structlog**: Structured logging

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
vim .env
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT secret key

### 3. Database Setup

```bash
# Initialize database (if using PostgreSQL)
createdb ai_sql_assistant

# Run migrations (when implemented)
alembic upgrade head
```

### 4. Start Development Server

```bash
# Start the FastAPI server
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📡 API Endpoints

### Natural Language Processing
```http
POST /api/nlp/parse-intent        # Parse user intent
POST /api/nlp/extract-entities    # Extract entities from query
POST /api/nlp/generate-sql        # Convert NL to SQL
```

### Query Execution
```http
POST /api/query/execute           # Execute SQL query
GET  /api/query/history           # Get query history
POST /api/query/validate          # Validate SQL query
```

### Schema Management
```http
POST /api/schema/upload           # Upload schema file
GET  /api/schema/info             # Get schema information
```

### Chat Interface
```http
POST /api/chat/message            # Send chat message
```

### Suggestions
```http
POST /api/suggestions             # Get query suggestions
```

## 🔧 Configuration Options

### AI Model Configuration
```env
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.1
OPENAI_MAX_TOKENS=1000
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Security Settings
```env
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### Database Configuration
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
DATABASE_ECHO=False
```

### CORS Settings
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_nlp_service.py
```

## 🔒 Security Features

### Query Security
- SQL injection prevention through parameterized queries
- Query validation and sanitization
- Blacklist of dangerous SQL keywords
- Query execution timeouts

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API rate limiting
- Request/response logging

### Data Protection
- Input validation and sanitization
- Secure file upload handling
- Environment variable protection
- Error message sanitization

## 📊 Monitoring & Logging

### Structured Logging
```python
from app.core.logger import get_logger

logger = get_logger(__name__)
logger.info("Processing query", user_id="123", query_length=45)
```

### Metrics Collection
- Request/response times
- Query execution metrics
- Error rates and types
- User activity patterns

## 🚀 Deployment

### Development
```bash
python main.py
```

### Production with Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment-specific Configuration
- Development: SQLite + console logging
- Staging: PostgreSQL + JSON logging
- Production: PostgreSQL + structured logging + monitoring

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **Update frontend API base URL** in `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

2. **CORS configuration** allows frontend requests
3. **Matching schemas** ensure type safety between frontend and backend
4. **WebSocket support** for real-time features (coming soon)

## 📈 Performance Optimization

### Caching Strategy
- Schema information cached with TTL
- Query results cached for repeated queries
- AI model responses cached for similar inputs

### Database Optimization
- Connection pooling for database efficiency
- Query optimization and indexing
- Async database operations

### AI Model Optimization
- Model response caching
- Prompt optimization for better results
- Fallback mechanisms for AI failures

## 🗺️ Roadmap

### Upcoming Features
- [ ] WebSocket support for real-time collaboration
- [ ] Advanced SQL query optimization suggestions
- [ ] Support for multiple database types (MySQL, SQLite, etc.)
- [ ] Query result visualization generation
- [ ] Advanced user analytics and insights
- [ ] Integration with popular BI tools
- [ ] Multi-tenant support
- [ ] Advanced caching with Redis Cluster

## 🆘 Troubleshooting

### Common Issues

1. **OpenAI API Key Issues**
   - Ensure `OPENAI_API_KEY` is set correctly
   - Check API quota and billing status

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Ensure database server is running
   - Check network connectivity

3. **Import Errors**
   - Ensure virtual environment is activated
   - Install dependencies: `pip install -r requirements.txt`

4. **CORS Issues**
   - Check `ALLOWED_ORIGINS` configuration
   - Ensure frontend URL is included

---

**Built with ❤️ for intelligent SQL query processing**
