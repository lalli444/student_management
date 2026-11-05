// Configuration for Student Management Frontend
// If hosted on Vercel or locally, this automatically selects the right backend API URL
const CONFIG = {
    // Default development backend URL
    DEFAULT_API_URL: "http://127.0.0.1:8000",
    
    // Key used to store user-configured API URL in browser localStorage
    STORAGE_KEY: "sms_api_base_url",
    
    // Get the active API Base URL
    getApiUrl() {
        // 1. Check if user configured a custom URL in the UI (stored in localStorage)
        const customUrl = localStorage.getItem(this.STORAGE_KEY);
        if (customUrl && customUrl.trim()) {
            return customUrl.trim().replace(/\/+$/, "");
        }
        
        // 2. Check if running on localhost or 127.0.0.1
        const isLocal = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1" || 
                        window.location.protocol === "file:";
        
        if (isLocal) {
            return this.DEFAULT_API_URL;
        }

        // 3. In production, this can point to the deployed Render backend URL.
        // Update this line after deploying backend to Render!
        return "https://student-management-api.onrender.com";
    },

    // Set custom API Base URL
    setApiUrl(url) {
        if (!url || !url.trim()) {
            localStorage.removeItem(this.STORAGE_KEY);
        } else {
            localStorage.setItem(this.STORAGE_KEY, url.trim().replace(/\/+$/, ""));
        }
    }
};
