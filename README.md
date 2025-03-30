# StudySensei-Advanced
 StudySensei - AI-Powered Virtual Mentor
# Project Name

## Description

This project is a React-based application that utilizes the Cohere AI API to generate roadmaps based on user input. To function properly, the application requires a secure environment configuration.

## Installation

1. Clone the repository:

   git clone https://github.com/your-repo-name.git
   cd your-repo-name


2. Install dependencies:

   npm install


4. Create a `.env` file in the root directory and add the following environment variables:

   JWT_SECRET=your_jwt_secret_key
   MONGODB_URI=your_mongodb_connection_uri
   COHERE_API_KEY=your_cohere_ai_api_key


5. Start the development server along with the server:
   node server.js
   npm run dev


 Usage

- Access the application in your browser at `http://localhost:5173` (or the specified port).
- Provide a topic and time input to generate a roadmap using the Cohere AI API.

 Requirements

- Node.js (Latest LTS version recommended)
- MongoDB database
- Cohere AI API key

