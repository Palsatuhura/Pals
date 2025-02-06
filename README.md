# Chat Application

## Introduction

Welcome to the Chat Application, a dynamic platform designed for seamless communication among friends and colleagues. This application empowers users to engage in real-time conversations, manage their contacts, and stay updated on their friends' online statuses. Whether you're looking to catch up with friends or collaborate with teammates, this chat application has you covered.

## Description

A real-time chat application that allows users to communicate with friends, manage conversations, and see online statuses.

## Features

- **User Authentication**: Securely register and log in to your account to access your conversations.
- **Real-Time Messaging with Socket.IO**: Enjoy instant messaging capabilities that allow you to send and receive messages without delay.
- **Add Friends and Manage Conversations**: Easily add friends using their session ID and manage your conversation list effortlessly.
- **User Status (Online/Offline)**: Stay informed about your friends' online statuses, enhancing your communication experience.
- **Notifications for New Messages and Friend Requests**: Receive timely notifications to ensure you never miss an important message or friend request.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **Node.js**: A JavaScript runtime for building scalable network applications.
- **Express**: A web application framework for Node.js, designed for building APIs.
- **MongoDB**: A NoSQL database for storing user data and messages.
- **Socket.IO**: A library for real-time web applications, enabling real-time, bidirectional communication.

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Pals
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables** as needed. Create a `.env` file in the root directory and configure your environment variables.
4. **Start the server**:
   ```bash
   npm start
   ```
5. **Start the client**:
   ```bash
   cd client
   npm start
   ```

## Usage

- **Log in or register** to start using the application.
- **Add friends** using their session ID to expand your network.
- **Start conversations** and send messages in real-time. The interface is intuitive and user-friendly, ensuring a smooth experience.

## API Endpoints

- `POST /users/add-friend`: Add a friend by session ID.
- `GET /api/conversations`: Retrieve conversations for the logged-in user.

## Contribution Guidelines

Contributions are welcome! Please follow these guidelines:

- Fork the repository and create a new branch for your feature or bug fix.
- Write clear, concise commit messages.
- Ensure your code passes all tests before submitting a pull request.
- Include documentation for any new features or changes.

## Future Enhancements

- Implementing video call functionality for enhanced communication.
- Adding support for file sharing within conversations.
- Enhancing the user interface for improved user experience.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
