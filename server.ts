import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 8080;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        // Optional: Configure CORS if needed, but since it's same origin mostly it's fine.
        // However, explicit CORS is safer for dev.
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Attach to global object so API routes can access it
    global.io = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined ${room}`);
        });

        socket.on("leave_room", (room) => {
            socket.leave(room);
        });

        // Handle status updates from clients (e.g., user starts a case)
        socket.on("status_update", () => {
            // Broadcast to admin room to refresh dashboard
            io.to("admin_notifications").emit("refresh_dashboard");
        });

        socket.on("disconnect", () => {
            // console.log("Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(
            `> Ready on http://${hostname}:${port}`
        );
    });
});
