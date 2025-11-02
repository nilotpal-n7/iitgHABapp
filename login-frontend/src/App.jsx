export default function App() {
  const handleLogin = (type) => {
    const clientId =
      import.meta.env.VITE_CLIENT_ID || "2cdac4f3-1fda-4348-a057-9bb2e3d184a1";
    const redirectUri = encodeURIComponent(
      import.meta.env.VITE_WEB_REDIRECT_URI ||
        "http://localhost:3000/api/auth/login/redirect/web"
    );

    const authUrl = `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=user.read&state=${type}&prompt=consent`;

    // Redirect to Microsoft login
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            IITG HAB Portal
          </h1>
          <p className="text-gray-600">Select your portal to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin("hab")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            HAB Admin Portal
          </button>

          <button
            onClick={() => handleLogin("hostel")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Hostel Admin Portal
          </button>

          <button
            onClick={() => handleLogin("smc")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            SMC Portal
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>You will be redirected to Microsoft login</p>
        </div>
      </div>
    </div>
  );
}
