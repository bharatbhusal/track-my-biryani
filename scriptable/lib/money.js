module.exports = { money, compact, moneyShort }

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

function money(value) {
	return INR.format(Number(value) || 0)
}

// ponytail: abs < 1000 falls through to integer rupees, decimals only where they matter
function trim(x) {
	return x >= 100 ? Math.round(x) : Math.round(x * 10) / 10
}

function compact(value) {
	const v = Number(value) || 0
	const sign = v < 0 ? "-" : ""
	const abs = Math.abs(v)
	if (abs >= 1e6) return `${sign}₹${trim(abs / 1e6)}M`
	if (abs >= 1000) return `${sign}₹${trim(abs / 1e3)}k`
	return `${sign}₹${Math.round(abs)}`
}

function moneyShort(value) {
	const v = Number(value) || 0
	return Math.abs(v) >= 100000 ? compact(v) : money(v)
}
