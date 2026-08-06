// Last-7-days spend trend. Families: medium, large, accessoryInline, accessoryCircular, accessoryRectangular.
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const theme = importModule("lib/theme")
const components = importModule("lib/components")
const money = importModule("lib/money")
const date = importModule("lib/date")
const endpoints = importModule("api/endpoints")

const { header, statRow, listRow, footer } = components
const { moneyShort } = money

function localISO(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function lastNDays(n) {
	const now = new Date()
	const out = []
	for (let i = n - 1; i >= 0; i--) {
		out.push(localISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)))
	}
	return out
}

// Chart rows are keyed by a string label ("date" → ISO, or "name" → "01 Aug"/"Aug 01") plus numeric category amounts.
function rowDate(row) {
	const key = Object.keys(row).find((k) => typeof row[k] === "string")
	if (!key) return null
	const v = row[key]
	if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
	const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
	const d1 = v.match(/(\d{1,2})\s+([a-z]{3})/i)
	const d2 = v.match(/([a-z]{3})\s+(\d{1,2})/i)
	const mon = d1 ? months[d1[2].toLowerCase()] : d2 ? months[d2[1].toLowerCase()] : undefined
	const day = d1 ? Number(d1[1]) : d2 ? Number(d2[2]) : NaN
	if (mon === undefined || !Number.isFinite(day)) return null
	let year = new Date().getFullYear()
	if (mon > new Date().getMonth()) year -= 1 // range can straddle New Year
	return localISO(new Date(year, mon, day))
}

// Day total = trust a total column when present, else sum numeric category keys (skip label/total keys).
function rowTotal(row) {
	if (typeof row._total === "number") return row._total
	if (typeof row.total === "number") return row.total
	let sum = 0
	for (const k of Object.keys(row)) {
		if (k === "date" || k === "name" || k === "_total" || k === "total") continue
		const v = row[k]
		if (typeof v === "number" && Number.isFinite(v)) sum += v
	}
	return sum
}

bootstrap.run(async () => {
	const { from, to } = date.rangeForDays(7)
	const data = await endpoints.chart({ from, to })

	// pad: chart series is sparse — zero-spend days still count as ₹0 rows
	const totals = {}
	for (const row of data.series || []) {
		const iso = rowDate(row)
		if (iso) totals[iso] = (totals[iso] || 0) + rowTotal(row)
	}
	const rows = lastNDays(7).map((iso) => ({ iso, total: totals[iso] || 0 }))
	const total = rows.reduce((s, r) => s + r.total, 0)
	const best = rows.reduce((m, r) => Math.max(m, r.total), 0)
	const avg = total / rows.length

	const w = new ListWidget()
	w.backgroundColor = theme.background()

	if (layout.isAccessory()) {
		const f = layout.family()
		if (f === "accessoryInline") {
			w.addText(`7d ${moneyShort(total)}`)
		} else if (f === "accessoryCircular") {
			const v = w.addText(moneyShort(total))
			v.font = layout.font("semibold", 18)
			v.textColor = theme.t("text")
		} else {
			for (const r of rows.slice(-3)) {
				const l = w.addText(`${date.formatDay(r.iso)} ${moneyShort(r.total)}`)
				l.font = layout.font("regular", 11)
				l.textColor = theme.t("text")
			}
		}
		return w
	}

	const isMedium = layout.family() === "medium"
	header(w, { icon: "📈", title: "Last 7 days" })
	w.addSpacer(4)
	const stats = [
		{ label: "7d total", value: moneyShort(total) },
		{ label: "Best day", value: moneyShort(best) },
	]
	if (!isMedium) stats.push({ label: "Avg/day", value: moneyShort(avg) })
	statRow(w, stats)
	w.addSpacer(6)
	for (const r of (isMedium ? rows.slice(-5) : rows)) {
		listRow(w, { title: date.formatDay(r.iso), amount: moneyShort(r.total) })
	}
	if (!isMedium) {
		w.addSpacer(4)
		footer(w, {
			left: `${date.formatDay(rows[0].iso)} – ${date.formatDay(rows[rows.length - 1].iso)}`,
			right: `${moneyShort(total)} total`,
		})
	}
	return w
})
