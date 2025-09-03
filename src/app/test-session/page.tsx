import { getSession } from "@/lib/auth/session";

export default async function TestSessionPage() {
  const session = await getSession();
  
  const getSessionInfo = () => {
    if (!session?.user) {
      return {
        hasSession: false,
        session: null,
        timeInfo: null
      };
    }

    // @ts-expect-error custom field
    const loginTime = session.user.loginTime;
    const now = Date.now();
    const sessionDuration = 60 * 60 * 1000; // 1 hour
    const expiryTime = loginTime + sessionDuration;
    const timeLeft = Math.max(0, expiryTime - now);
    const isExpired = timeLeft <= 0;

    return {
      hasSession: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          loginTime: loginTime
        }
      },
      timeInfo: {
        loginTime: new Date(loginTime).toLocaleString(),
        expiryTime: new Date(expiryTime).toLocaleString(),
        timeLeft: Math.floor(timeLeft / 1000), // seconds
        isExpired,
        formattedTimeLeft: `${Math.floor(timeLeft / 60000)}:${Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0')}`
      }
    };
  };

  const sessionInfo = getSessionInfo();
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Session Status:</h2>
        <pre className="bg-white p-4 rounded text-sm overflow-auto">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>

      {sessionInfo.hasSession && sessionInfo.timeInfo && (
        <div className="bg-blue-100 p-4 rounded mb-4">
          <h2 className="text-lg font-semibold mb-2">Session Timer Info:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Login Time:</strong> {sessionInfo.timeInfo.loginTime}
            </div>
            <div>
              <strong>Expiry Time:</strong> {sessionInfo.timeInfo.expiryTime}
            </div>
            <div>
              <strong>Time Left:</strong> {sessionInfo.timeInfo.formattedTimeLeft}
            </div>
            <div>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                sessionInfo.timeInfo.isExpired 
                  ? 'bg-red-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                {sessionInfo.timeInfo.isExpired ? 'EXPIRED' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 space-x-2">
        <a 
          href="/logout" 
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </a>
        <a 
          href="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Home
        </a>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
