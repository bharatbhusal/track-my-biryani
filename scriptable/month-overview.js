// Track My Biryani — month-overview widget
// Monthly spend vs per-day pace for the current month.
const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const moneyLib = importModule("lib/money")
const date = importModule("lib/date")

const { header, statRow, listRow, divider, footer } = components
const { t } = theme
const { font } = layout
const { money, moneyShort, compact } = moneyLib
const { currentMonthRange, currentMonthProgress, formatDay, relativeDay } = date

// ponytail: approximate card widths per family; stacks clip instead of wrap so
// the bar can never spill onto a second line
function barWidth() {
	const f = layout.family()
	if (f === "small") return 123
	if (f === "extraLarge") return 672
	if (f === "accessoryRectangular") return 137
	return 297
}

function bar(parent, { value, color, trackColor }) {
	const total = barWidth()
	const fill = Math.round(total * Math.max(0, Math.min(1, value)))
	const row = parent.addStack()
	row.layoutHorizontally()
	const filled = row.addStack()
	filled.size = new Size(fill, 6)
	filled.cornerRadius = 3
	filled.backgroundColor = color || t("accent")
	const track = row.addStack()
	track.size = new Size(total - fill, 6)
	track.cornerRadius = 3
	track.backgroundColor = trackColor || t("border")
	return row
}

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
		const total = widget.addText(money(totalSpend))
		total.font = font("semibold", 14)
		total.textColor = t("primary")
		bar(widget, { value: month.progress, color: t("accent") })
		return widget
	}

	if (layout.family() === "small") {
		widget.noRefreshFooter = true
		header(widget, { icon: "💸", title: "Track My Biryani" })
		statRow(widget, [
			{ label: "Spent", value: compact(totalSpend), color: t("primary") },
			{ label: "Per Day", value: moneyShort(perDay) },
		])
		bar(widget, { value: month.progress, color: t("accent") })
		footer(widget, { left: `Day ${month.currentDay}/${month.daysInMonth}`, right: "" })
		return widget
	}

	header(widget, { icon: "💸", title: "Track My Biryani", subtitle: "This Month" })
	statRow(widget, [
		{ label: "Spent", value: money(totalSpend), emphasis: true, color: t("primary") },
		{ label: "Per Day", value: moneyShort(perDay) },
	])
	bar(widget, { value: month.progress, color: t("accent") })

	if (layout.mode() === "expanded") {
		divider(widget)
		listRow(widget, {
			emoji: "📅",
			title: `Day ${month.currentDay}/${month.daysInMonth}`,
			subtitle: relativeDay(new Date().toISOString()),
		})
		footer(widget, { left: formatDay(to), right: "" })
		return widget
	}

	footer(widget, { left: `Day ${month.currentDay}/${month.daysInMonth}`, right: "" })
	return widget
})
