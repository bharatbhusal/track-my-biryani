const config = importModule("config")

module.exports = { ensureCredentials, getCredentials, getAuthCookie, setAuthCookie, clearAuth, resetCredentialsIfNeeded }

function getCredentials() {
	const username = Keychain.get(config.KEYS.USERNAME)
	const password = Keychain.get(config.KEYS.PASSWORD)
	return username ? { username, password } : null
}

async function ensureCredentials() {
	const existing = getCredentials()
	if (existing) return existing
	const alert = new Alert()
	alert.title = "Track My Biryani"
	alert.addTextField("Username")
	alert.addSecureTextField("Password")
	alert.addAction("Save")
	await alert.present()
	const username = alert.textFieldValue(0)
	const password = alert.textFieldValue(1)
	Keychain.set(config.KEYS.USERNAME, username)
	Keychain.set(config.KEYS.PASSWORD, password)
	return { username, password }
}

function getAuthCookie() {
	return Keychain.get(config.KEYS.AUTH_COOKIE) || null
}

function setAuthCookie(token) {
	Keychain.set(config.KEYS.AUTH_COOKIE, token)
}

function clearAuth() {
	Keychain.remove(config.KEYS.USERNAME)
	Keychain.remove(config.KEYS.PASSWORD)
	Keychain.remove(config.KEYS.AUTH_COOKIE)
}

function resetCredentialsIfNeeded() {
	if (config.RESET_CREDENTIALS) {
		Keychain.remove(config.KEYS.USERNAME)
		Keychain.remove(config.KEYS.PASSWORD)
	}
}
