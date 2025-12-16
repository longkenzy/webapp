
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const isSocketRunning = !!(global as any).io;
    const processEnv = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOSTNAME: process.env.HOSTNAME,
    };

    return NextResponse.json({
        socketRunning: isSocketRunning,
        message: isSocketRunning
            ? "Socket.io is running on server"
            : "Socket.io is NOT running. Server might be running in default Next.js mode instead of custom server.",
        env: processEnv,
        timestamp: new Date().toISOString()
    });
}
