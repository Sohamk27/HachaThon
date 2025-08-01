# 🤖 AI SQL Assistant - Full Stack Application

A powerful full-stack application that converts natural language queries into SQL using advanced AI models. This project combines a React TypeScript frontend with a Python FastAPI backend to provide an intelligent, conversational interface for database querying.

## 🏗️ Project Structure

```
HackaThon/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API integration
│   │   ├── store/              # State management
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # Python FastAPI backend
│   ├── app/
│   │   ├── api/endpoints/      # API endpoints
│   │   ├── core/               # Core configuration
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities
│   ├── requirements.txt
│   └── main.py
├── setup.sh                    # Development setup script
└── README.md                   # This file
```

## 🌟 Features

### 🎯 Natural Language to SQL Conversion
- **GPT-4 Powered**: Uses OpenAI's latest models for accurate interpretation
- **Context Awareness**: Maintains conversation history for better understanding
- **Intent Recognition**: Automatically detects query types (SELECT, INSERT, UPDATE, etc.)
- **Entity Extraction**: Identifies tables, columns, values, and relationships

### 🎨 Modern Frontend
- **React 18**: Latest React with TypeScript for type safety
- **Material-UI**: Professional, responsive component library
- **Real-time Chat**: Conversational interface with AI assistant
- **Data Visualization**: Interactive charts and tables with Recharts
- **Voice Input**: Speech-to-text capability for hands-free querying
- **Schema Management**: Visual database schema explorer

### 🚀 Robust Backend
- **FastAPI**: High-performance async Python web framework
- **Secure Execution**: SQL injection prevention and query validation
- **Schema Intelligence**: Automatic database introspection and caching
- **Vector Embeddings**: Semantic search for schema matching
- **Comprehensive Logging**: Structured logging with monitoring

### 🔒 Security & Performance
- **Authentication**: JWT-based user authentication
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Comprehensive request/response validation
- **Caching**: Redis-based caching for improved performance
- **Connection Pooling**: Efficient database connection management

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** for the frontend
- **Python 3.8+** for the backend
- **OpenAI API Key** for AI functionality

### 1. Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd HackaThon

# Run the automated setup script
./setup.sh
```

### 2. Manual Setup

#### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and other settings

# Start the backend server
python main.py
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Backend Configuration (backend/.env)
```env
# Required: OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=sqlite+aiosqlite:///./data/ai_sql_assistant.db

# Security
SECRET_KEY=your-super-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Configuration (frontend/.env.local)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Features
VITE_ENABLE_VOICE=true
VITE_MAX_QUERY_LENGTH=1000
```

## 🎯 Usage Examples

### Natural Language Queries
- "Show me all users who registered last month"
- "What's the total revenue for each product category?"
- "Find customers with more than 5 orders"
- "Update the price of product with ID 123 to 99.99"

### Features Showcase
1. **Upload Schema**: Drag and drop your SQL DDL file
2. **Natural Queries**: Type questions in plain English
3. **Voice Input**: Click the microphone for speech-to-text
4. **Results Visualization**: View data as tables, charts, or raw JSON
5. **Query History**: Access and re-run previous queries
6. **AI Chat**: Get help and clarifications from the AI assistant

## 🔌 API Integration

### Key Endpoints

#### Natural Language Processing
```http
POST /api/nlp/parse-intent        # Parse user intent
POST /api/nlp/extract-entities    # Extract entities from query
POST /api/nlp/generate-sql        # Convert natural language to SQL
```

#### Query Management
```http
POST /api/query/execute           # Execute SQL safely
GET  /api/query/history           # Get query history
POST /api/query/validate          # Validate SQL syntax
```

#### Schema Operations
```http
POST /api/schema/upload           # Upload database schema
GET  /api/schema/info             # Get schema information
```

### Example API Usage

```javascript
// Generate SQL from natural language
const response = await fetch('/api/nlp/generate-sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Show me all active users",
    schema_context: schemaData,
    conversation_history: []
  })
});

const result = await response.json();
console.log(result.sql_query); // Generated SQL
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/                    # Run all tests
pytest --cov=app               # Run with coverage
```

### Frontend Testing
```bash
cd frontend
npm test                       # Run Jest tests
npm run test:coverage         # Run with coverage
```

## 📦 Deployment

### Development
```bash
# Backend
cd backend && python main.py

# Frontend  
cd frontend && npm run dev
```

### Production

#### Backend Deployment
```bash
# Using Docker
docker build -t ai-sql-backend backend/
docker run -p 8000:8000 ai-sql-backend

# Using systemd service
sudo systemctl start ai-sql-backend
```

#### Frontend Deployment
```bash
# Build for production
cd frontend && npm run build

# Deploy to Vercel, Netlify, or any static hosting
npm run deploy
```

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18** - Modern React with concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **Material-UI** - Professional React component library
- **Zustand** - Lightweight state management
- **TanStack Query** - Powerful data fetching and caching
- **Recharts** - Composable charting library

### Backend Technologies
- **FastAPI** - Modern, high-performance web framework
- **Pydantic** - Data validation using Python type hints
- **SQLAlchemy** - SQL toolkit and ORM
- **OpenAI** - GPT-4 integration for natural language processing
- **LangChain** - Framework for developing LLM applications
- **ChromaDB** - Vector database for embeddings
- **Uvicorn** - Lightning-fast ASGI server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode for frontend
- Use Black and isort for Python code formatting
- Add tests for new features
- Update documentation for API changes
- Ensure type safety across the stack

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **OpenAI API Key Errors**
   - Ensure your API key is valid and has sufficient credits
   - Check the key is properly set in `backend/.env`

2. **Frontend/Backend Connection Issues**
   - Verify both servers are running on correct ports
   - Check CORS configuration in backend settings
   - Ensure API base URL is correct in frontend environment

3. **Database Connection Problems**
   - For SQLite: Check file permissions and path
   - For PostgreSQL: Verify connection string and server status

4. **Node.js/Python Version Issues**
   - Use Node.js 18+ and Python 3.8+
   - Consider using version managers (nvm, pyenv)

### Getting Help
- Check the API documentation at http://localhost:8000/docs
- Review the comprehensive logging in both frontend and backend
- Open an issue for bugs or feature requests

## 🗺️ Roadmap

### Upcoming Features
- [ ] Real-time collaboration with WebSockets
- [ ] Support for multiple database types (MySQL, PostgreSQL, etc.)
- [ ] Advanced query optimization suggestions
- [ ] Integration with popular BI tools
- [ ] Mobile app companion
- [ ] Multi-tenant support
- [ ] Advanced analytics and user insights

### Version History
- **v1.0.0**: Initial release with core NL-to-SQL functionality
- **v1.1.0**: Enhanced schema management and chat interface
- **v1.2.0**: Added voice recognition and improved visualizations

---

**Built with ❤️ for the future of intelligent data querying**
