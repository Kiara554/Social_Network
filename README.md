# Social network : X
## Breezy

Designed a lightweight social network optimized for low-resource environments, including user account management, post publishing, news feed, and notifications. Backend built with microservices, frontend responsive and secure.

(Node.js, Express.js, React.js, Next.js, JWT, MongoDB, Mongoose, Docker, Tailwind CSS, microservices architecture, RESTful API, security)

## 🗂️ Project Structure

The repository is organized to separate the different components of the application:

Social_Network/
├─ breezy-frontend/ # React + Next.js app (UI of the social network)
├─ api-auth/ # Authentication API (handles user login, signup, JWT tokens)
├─ api-gateway/ # API Gateway (routes requests to the appropriate microservices, manages database calls)
├─ posts-service/ # Service managing posts creation, editing, deletion
├─ users-service/ # Service managing user profiles and data
├─ docker/ # Dockerfiles and docker-compose setup

## 🔑 Component Overview

- **breezy/frontend:**  
  The main application interface where users interact with the social network. It is responsive and built with React, Next.js, and Tailwind CSS.  

- **api-auth:**  
  Handles authentication. Responsible for login, signup, password management, and JWT token issuance. Ensures secure access to other services.  

- **api-gateway:**  
  Central gateway that manages all API requests. Routes calls from the frontend to the correct microservices (users, posts, etc.) and communicates with the database.  

- **posts-service:**  
  Manages all operations related to posts: creating, editing, deleting, and retrieving posts.  

- **users-service:**  
  Manages user data and profiles, including fetching user information, updating profiles, and handling user settings.  

- **docker/:**  
  Contains Dockerfiles and docker-compose configuration for containerizing and running all services together in a consistent environment.

---

## ⚡ How to Run

1. Clone the repository:  
```bash
git clone https://github.com/Kiara554/Social_Network.git
cd Social_Network
