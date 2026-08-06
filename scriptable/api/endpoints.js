const { request } = importModule("api/client")

module.exports = { overview, categories, categoriesWithStats, distribution, expenses, chart, buckets, audit }

// ponytail: no URLSearchParams in Scriptable, build the query string manually
function queryString(params) {
	const parts = Object.keys(params)
		.filter((k) => params[k] !== undefined)
		.map((k) => `${k}=${encodeURIComponent(params[k])}`)
	return parts.length ? "?" + parts.join("&") : ""
}

function overview({ from, to, bucketId } = {}) {
	return request(`/expenses/overview${queryString({ from, to })}`, { bucketId })
}

function categories({ bucketId } = {}) {
	return request("/categories", { bucketId })
}

function categoriesWithStats({ from, to, bucketId } = {}) {
	return request(`/categories/stats${queryString({ from, to })}`, { bucketId })
}

function distribution({ from, to, bucketId } = {}) {
	return request(`/categories/distribution${queryString({ from, to })}`, { bucketId })
}

function expenses({ limit = 5, page = 1, from, to, bucketId, sortBy = "paidAt", order = "desc" } = {}) {
	return request(`/expenses${queryString({ limit, page, from, to, sortBy, order })}`, { bucketId })
}

function chart({ from, to, bucketId } = {}) {
	return request(`/expenses/chart${queryString({ from, to })}`, { bucketId })
}

function buckets() {
	return request("/buckets")
}

function audit({ limit = 10 } = {}) {
	return request(`/audit${queryString({ limit })}`)
}
