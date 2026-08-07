const config = importModule("config")
const keychain = importModule("lib/keychain")
const debug = importModule("lib/debug")

class ApiError extends Error {
	constructor(message, code, status) {
		super(message)
		this.name = "ApiError"
		this.code = code
		this.status = status
	}
}

async function request(path, { method = "GET", body, bucketId, retried } = {}) {
	const req = new Request(config.BASE_URL + path)
	req.method = method
	req.timeoutInterval = config.REQUEST_TIMEOUT
	req.allowInsecureRequest = true
	const token = keychain.getAuthCookie()
	if (token) req.headers = { Cookie: `${config.KEYS.AUTH_COOKIE}=${token}` }
	if (body !== undefined && body !== null) {
		req.headers = { ...(req.headers || {}), "Content-Type": "application/json" }
		req.body = JSON.stringify(body)
	}
	if (bucketId) req.headers = { ...(req.headers || {}), [config.BUCKET_HEADER]: bucketId }
	debug.log(`[request] ${method} ${path}`, bucketId ? `bucket=${bucketId}` : "")
	const payload = await req.loadJSON()
	const statusCode = req.response.statusCode
	if (statusCode === 401 && !retried) {
		await login()
		return request(path, { method, body, bucketId, retried: true })
	}
	if (statusCode >= 400) {
		throw new ApiError(payload?.error?.message ?? "Request failed", payload?.error?.code, statusCode)
	}
	return payload.data
}

async function login() {
	const creds = await keychain.ensureCredentials()
	const req = new Request(config.BASE_URL + "/auth/login")
	req.method = "POST"
	req.timeoutInterval = config.REQUEST_TIMEOUT
	req.allowInsecureRequest = true
	req.headers = { "Content-Type": "application/json" }
	req.body = JSON.stringify({ username: creds.username, password: creds.password })
	const payload = await req.loadJSON()
	const statusCode = req.response.statusCode
	if (statusCode >= 400) {
		throw new ApiError("Login failed — check credentials", "LOGIN_FAILED", statusCode)
	}
	const cookie = (req.response.cookies || []).find((c) => c.name === config.KEYS.AUTH_COOKIE)
	if (cookie) keychain.setAuthCookie(cookie.value)
	return payload.data
}

async function ensureSession() {
	const token = keychain.getAuthCookie()
	if (!token) await login()
}

module.exports = { request, login, ensureSession, ApiError }
