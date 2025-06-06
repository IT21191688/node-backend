# Coco Tech API

![Coco Tech Logo](https://via.placeholder.com/800x200?text=Coco+Tech+API)

A comprehensive Node.js backend for coconut farming management, processing optimization, and yield prediction.

## 📋 Overview

The Coco Tech API provides an intelligent backend infrastructure for the Coco Tech platform - a complete solution for coconut farmers, processors, and distributors. This TypeScript-based Node.js application offers smart predictions, management tools, and analytics to optimize farming operations and increase productivity across the coconut value chain.

## ✨ Key Features

### 🌱 Farming Management
- **Watering Schedule Optimization** - AI-driven irrigation recommendations based on environmental conditions and plant needs
- **Yield Prediction** - Advanced forecasting of coconut yields using historical data and environmental factors
- **Actual Yield Tracking** - Record and analyze harvest data to improve future predictions

### 🥥 Processing Intelligence
- **Copra Processing** - Monitor and optimize copra production processes
- **Oil Yield Prediction** - Estimate expected oil yields from coconut processing
- **Price Prediction** - Market intelligence and price forecasting for coconut products

### 🔧 System Management
- **User Management** - Complete authentication, authorization, and profile management
- **Device Integration** - IoT device registration, monitoring, and control
- **Location Tracking** - Geographical management of farms and processing facilities

## 🏗️ Architecture

### Project Structure
```
NODE-BACKEND/
├── dist/               # Compiled TypeScript output
├── logs/               # Application logs
├── node_modules/       # Node.js dependencies
├── src/                # Source code
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   │   ├── ActualYieldController.ts
│   │   ├── authController.ts
│   │   ├── copraController.ts
│   │   ├── deviceController.ts
│   │   ├── locationController.ts
│   │   ├── PricePredictionController.ts
│   │   ├── userController.ts
│   │   ├── wateringController.ts
│   │   └── YieldPredictionController.ts
│   ├── cron/           # Scheduled tasks
│   ├── middleware/     # Express middleware
│   ├── models/         # Data models
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── app.ts          # Application entry point
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package-lock.json   # Dependency lock file
└── package.json        # Project metadata and dependencies
```

### Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 🚀 Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- MongoDB (local instance or Atlas connection)

### Installation

1. Clone the repository
```bash
git https://github.com/IT21191688/node-backend.git
```

2. Install dependencies
```bash
npm install
# or using yarn
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit the `.env` file and add your configuration:
```
PORT=3000
MONGODB_URI=
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Build the project
```bash
npm run build
# or using yarn
yarn build
```

5. Start the server
```bash
npm start
# or using yarn
yarn start
```

For development with hot-reloading:
```bash
npm run dev
# or using yarn
yarn dev
```

## 🔄 API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
```
Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "farmer"
}
```

#### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}

## 📱 Mobile Integration

The Coco Tech API is designed to seamlessly integrate with the Coco Tech mobile application, allowing farmers to:

- Receive real-time watering recommendations
- Track harvests and monitor yields
- Manage copra processing operations
- View price forecasts and market trends
- Monitor farm locations and assets
- Control and receive data from IoT devices

## 🔒 Security

- JWT-based authentication with token expiration
- Role-based access control (Admin, Farmer, Processor)
- Request rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Environment-specific security configurations

## 🧪 Testing

Run the test suite with:

```bash
npm test
# or using yarn
yarn test
```

Generate test coverage reports:

```bash
npm run test:coverage
# or using yarn
yarn test:coverage
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📦 Dependencies

Key dependencies include:

- `express`: Web framework
- `typescript`: Programming language
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: Authentication
- `bcrypt`: Password hashing
- `winston`: Logging
- `joi`: Data validation
- `node-cron`: Scheduled tasks
- `cors`: CORS support
- `swagger-ui-express`: API documentation
- `jest`: Testing framework

## 🛠️ Development Guidelines

- Follow the TypeScript coding standards
- Write unit tests for all new features
- Use descriptive commit messages
- Create feature branches and use pull requests
- Document all API endpoints using JSDoc comments


## 👥 Team

- IT21191688 - Ruwanpura M.W.H.S.L
- IT21191442 - Rathanyaka G.T.S.T
- IT21096570 - Wickramasinghe T.D.B
- IT21071652 - Hewapathiranage T.K

## 📞 Contact

For support or inquiries, please contact:
- Email: sadeepalakshan0804@gmail.com

---

Made with ❤️ by the Coco Tech Team