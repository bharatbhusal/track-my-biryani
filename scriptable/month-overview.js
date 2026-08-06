// Track My Biryani — month-overview widget
// Monthly spend vs projected month-end spend.
const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const moneyLib = importModule("lib/money")
const date = importModule("lib/date")

const { header, stat, statRow, progressBar, listRow, divider, footer } = components
const { t } = theme
const { font } = layout
const { money, moneyShort, compact } = moneyLib
const { currentMonthRange, currentMonthProgress, formatDay, relativeDay, projectSpend } = date

bootstrap.run(async () => {
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()

	const { from, to } = currentMonthRange()
	const month = currentMonthProgress()

	const rows = await endpoints.overview({ from, to })
	const data = {}
	for (const r of rows) data[r.key] = r.value
	const totalSpend = Number(data.total_spend) || 0
	const perDay = Number(data.spend_per_day) || 0
	const projected = projectSpend(perDay, month.daysInMonth)

	if (layout.isAccessory()) {
		const fam = layout.family()
		if (fam === "accessoryInline") {
			const line = widget.addText(`💸 ${moneyShort(totalSpend)} this month`)
			line.font = font("medium", 10)
			return widget
		}
		if (fam === "accessoryCircular") {
			// ponytail: compact so the number fits the tiny circular face
			const value = widget.addText(compact(totalSpend))
			value.font = font("semibold", 12)
			value.textColor = t("text")
			value.centerAlignText()
			return widget
		}
		// accessoryRectangular
		const total = widget.addText(money(totalSpend))
		total.font = font("semibold", 14)
		total.textColor = t("primary")
		progressBar(widget, { value: month.progress, color: t("accent") })
		return widget
	}

	if (layout.family() === "small") {
		header(widget, { icon: "💸", title: "This month" })
		stat(widget, { label: "Spent", value: money(totalSpend), emphasis: true, color: t("primary") })
		progressBar(widget, { value: month.progress, color: t("accent") })
		footer(widget, {
			left: `Day ${month.currentDay}/${month.daysInMonth}`,
			right: `≈ ${moneyShort(projected)}`,
		})
		return widget
	}

	header(widget, { icon: "💸", title: "This month" })
	statRow(widget, [
		{ label: "Spent", value: money(totalSpend), emphasis: true, color: t("primary") },
		{ label: "Per day", value: moneyShort(perDay) },
	])
	progressBar(widget, { value: month.progress, color: t("accent") })

	if (layout.mode() === "expanded") {
		divider(widget)
		listRow(widget, {
			emoji: "📅",
			title: `Day ${month.currentDay}/${month.daysInMonth}`,
			subtitle: relativeDay(new Date().toISOString()),
		})
		listRow(widget, { emoji: "📈", title: "Projected by month end", amount: moneyShort(projected) })
		footer(widget, { left: formatDay(to), right: "auto-refresh" })
		return widget
	}

	footer(widget, {
		left: `Day ${month.currentDay}/${month.daysInMonth}`,
		right: `≈ ${moneyShort(projected)}`,
	})
	return widget
})
