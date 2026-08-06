// Track My Biryani — category-breakdown widget
// Top categories by spend share for the current month.
const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const money = importModule("lib/money")
const date = importModule("lib/date")
const format = importModule("lib/format")

const { header, listRow, progressBar, footer } = components
const { t } = theme
const { font } = layout
const { moneyShort } = money
const { currentMonthRange } = date
const { pct, truncate, pluralize } = format

bootstrap.run(async () => {
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()

	const { from, to } = currentMonthRange()
	const [rows, over] = await Promise.all([
		endpoints.distribution({ from, to }),
		endpoints.overview({ from, to }),
	])
	const total = Number((over || []).find((r) => r.key === "total_spend")?.value) || 0
	const share = (c) => (total > 0 ? c.value / total : 0)

	if (!rows.length) {
		const empty = widget.addText("No expenses this month")
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
		// accessoryRectangular: up to 3 rows, pct only (no amounts)
		for (const c of rows.slice(0, 3)) {
			listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
		}
		return widget
	}

	if (layout.family() === "small") {
		header(widget, { title: "Categories" })
		for (const c of rows.slice(0, 3)) {
			listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
		}
		footer(widget, { left: truncate(rows[0].name, 12), right: moneyShort(total) })
		return widget
	}

	header(widget, { title: "Categories" })
	if (layout.mode() === "expanded") {
		for (const c of rows.slice(0, 6)) {
			listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
			progressBar(widget, { value: share(c), color: c.color })
		}
		footer(widget, { left: pluralize(rows.length, "category"), right: "this month" })
		return widget
	}

	for (const c of rows.slice(0, 4)) {
		listRow(widget, { title: c.name, right: pct(share(c)), color: c.color })
		progressBar(widget, { value: share(c), color: c.color })
	}
	return widget
})
