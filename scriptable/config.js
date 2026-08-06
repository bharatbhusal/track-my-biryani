// production https://trackmybiryani.bharatbhusal.com/api
module.exports = {
	BASE_URL: "http://localhost:3000/api",
	// production https://trackmybiryani.bharatbhusal.com
	WEBSITE_URL: "http://localhost:3000",
	KEYS: { USERNAME: "tmb_username", PASSWORD: "tmb_password", AUTH_COOKIE: "tmb_auth" },
	BUCKET_HEADER: "x-bucket-id",
	RESET_CREDENTIALS: false, // set true to force re-prompt
	DEBUG: true, // set false to silence logs
	REFRESH_MINUTES: 15, // widget refreshAfterDate
	REQUEST_TIMEOUT: 15, // seconds
}
