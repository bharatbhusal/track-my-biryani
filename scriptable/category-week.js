// Track My Biryani — category-week widget
// Bar graph of top categories by spend share for the current week.
const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const money = importModule("lib/money")
const date = importModule("lib/date")
const format = importModule("lib/format")

const { header, listRow, footer } = components
const { t } = theme
const { font } = layout
const { moneyShort } = money
const { rangeForDays } = date
const { pct, truncate, pluralize, blockBar } = format

// one-line bar graph row: name ············ bar ······ pct
function barRow(parent, { title, value, color }) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.spacing = 6
	const name = row.addText(truncate(title, 14))
	name.font = font("semibold", 12)
	name.textColor = t("text")
	row.addSpacer()
	const bar = row.addText(blockBar(value))
	bar.font = font("mono", 10)
	bar.textColor = color ? new Color(color) : t("accent")
	const p = row.addText(pct(value))
	p.font = font("regular", 11)
	p.textColor = t("muted")
	return row
}

bootstrap.run(async () => {
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()

	const { from, to } = rangeForDays(7)
	const [chart, over] = await Promise.all([
		endpoints.chart({ from, to }),
		endpoints.overview({ from, to }),
	])
	const total = Number((over || []).find((r) => r.key === "total_spend")?.value) || 0

	const totals = {}
	for (const day of chart.series || []) {
		for (const [cat, amount] of Object.entries(day)) {
			if (cat === "name") continue
			totals[cat] = (totals[cat] || 0) + Number(amount)
		}
	}
	const rows = Object.entries(totals)
		.map(([name, value]) => ({ name, value, color: chart.categoryColors?.[name] }))
		.sort((a, b) => b.value - a.value)
	const share = (c) => (total > 0 ? c.value / total : 0)

	if (!rows.length) {
		const empty = widget.addText("No expenses this week")
		empty.font = font("regular", 12)
		empty.textColor = t("muted")
		return widget
	}

	if (layout.isAccessory()) {
		const fam = layout.family()
		const top = rows[0]
		if (fam === "accessoryInline") {
			const line = widget.addText(`${truncate(top.name, 10)} ${pct(share(top))}`)
			line.font = font("medium", 10)
			return widget
		}
		if (fam === "accessoryCircular") {
			const value = widget.addText(pct(share(top)))
			value.font = font("semibold", 12)
			value.textColor = t("text")
			value.centerAlignText()
			const name = widget.addText(truncate(top.name, 8))
			name.font = font("regular", 10)
			name.textColor = t("muted")
			name.centerAlignText()
			return widget
		}
		for (const c of rows.slice(0, 3)) {
			listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
		}
		return widget
	}

	if (layout.family() === "small") {
		header(widget, { icon: "📊", title: "This week" })
		for (const c of rows.slice(0, 4)) {
			listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
		}
		footer(widget, { left: truncate(rows[0].name, 12), right: moneyShort(total) })
		return widget
	}

	header(widget, { icon: "📊", title: "This week" })
	if (layout.mode() === "expanded") {
		for (const c of rows.slice(0, 8)) {
			barRow(widget, { title: c.name, value: share(c), color: c.color })
		}
		footer(widget, { left: pluralize(rows.length, "category"), right: "this week" })
		return widget
	}

	for (const c of rows.slice(0, 5)) {
		barRow(widget, { title: c.name, value: share(c), color: c.color })
	}
	return widget
})
