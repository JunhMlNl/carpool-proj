const io = require("socket.io-client");

// 서버와 연결
const socket = io("http://localhost:81/chatroom", {
    auth: {
        token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imp1bmdtaW4iLCJpYXQiOjE3MzE5ODU3NDksImV4cCI6MTczMTk4OTM0OX0.YI6kH37hzhFAauY38XaKLB8nyfwt6mLx6gBacxw0Tig", // Postman으로 발급받은 JWT 토큰을 입력
    },
});

// 연결 성공
socket.on("connect", () => {
    console.log("Connected to server");

    // 방 입장
    socket.emit("enter", ["user2", "room1"]);

    // 메시지 보내기
    socket.emit("send", { room: "room1", username: "testuser", message: "Hello, world!" });
});

// 메시지 받기
socket.on("message", (data) => {
    console.log("Message received:", data);
});

// 연결 에러
socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
});
