const { request } = importModule("api/client")
const keychain = importModule("lib/keychain")

module.exports = { me, logout }

async function me() {
	return request("/auth/me")
}

async function logout() {
	await request("/auth/logout", { method: "POST" })
	keychain.clearAuth()
}
