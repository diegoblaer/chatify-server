const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const { addUser, removeUser, getUser, getAllUsers } = require("./utils");

const app = express();
const server = createServer(app);
const port = process.env.PORT || 4000;

const io = new Server(server, {
  port,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const EVENTS = {
  JOIN: "join",
  USER_CONNECTED: "user_connected",
  USER_DISCONNECTED: "user_disconnected",
  NEW_MESSAGE: "new_message",
  DISCONNECT: "disconnect",
};

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on(EVENTS.JOIN, (options, callback) => {
    console.log(`User connected: ${JSON.stringify(options)}`);

    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return;
    }

    console.log(`User connected: ${user.id}`);

    io.emit(EVENTS.USER_CONNECTED, {
      user,
      connectedUsers: getAllUsers(),
    });

    callback?.();
  });

  socket.on(EVENTS.NEW_MESSAGE, (text) => {
    const user = getUser(socket.id);
    console.log(`New message from: ${user.id}`);
    io.emit(EVENTS.NEW_MESSAGE, { user, text });
  });

  socket.on(EVENTS.DISCONNECT, () => {
    const user = removeUser(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.id}`);
      io.emit(EVENTS.USER_DISCONNECTED, {
        user,
        connectedUsers: getAllUsers(),
      });
    }
  });
});
