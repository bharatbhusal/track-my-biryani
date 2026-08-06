// Month summary for a bucket (widgetParameter = bucket id) or Personal. All families.
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const theme = importModule("lib/theme")
const components = importModule("lib/components")
const money = importModule("lib/money")
const date = importModule("lib/date")
const format = importModule("lib/format")
const endpoints = importModule("api/endpoints")

const { header, statRow, progressBar, footer } = components

bootstrap.run(async () => {
	const raw = args.widgetParameter
	const bucketId = raw && String(raw).trim() ? String(raw).trim() : undefined

	const { from, to } = date.currentMonthRange()
	const overviewP = endpoints.overview({ from, to, bucketId })

	let bucket = null
	if (bucketId) {
		const buckets = await endpoints.buckets()
		bucket = (buckets.items || []).find((b) => b._id === bucketId) || null
	}
	const overview = await overviewP

	const stats = {}
	for (const s of overview || []) stats[s.key] = s.value
	const total = Number(stats.total_spend) || 0
	const perDay = Number(stats.spend_per_day) || 0
	const prog = date.currentMonthProgress()
	const projected = date.projectSpend(perDay, prog.daysInMonth)

	const name = bucket ? bucket.name : bucketId ? "Bucket" : "Personal"
	// ponytail: header() treats len > 2 icons as SFSymbols, so long emoji fall back
	const icon = bucket && bucket.icon && bucket.icon.length <= 2 ? bucket.icon : "🗂️"

	const w = new ListWidget()
	w.backgroundColor = theme.background()

	if (layout.isAccessory()) {
		const f = layout.family()
		if (f === "accessoryInline") {
			w.addText(`${format.truncate(name, 14)} ${money.moneyShort(total)}`)
		} else if (f === "accessoryCircular") {
			const v = w.addText(money.moneyShort(total))
			v.font = layout.font("semibold", 18)
			v.textColor = theme.t("text")
		} else {
			const t = w.addText(format.truncate(name, 16))
			t.font = layout.font("semibold", 12)
			t.textColor = theme.t("text")
			const d = w.addText(`${money.moneyShort(total)} · ${money.moneyShort(perDay)}/day`)
			d.font = layout.font("regular", 11)
			d.textColor = theme.t("muted")
		}
		return w
	}

	const isSmall = layout.family() === "small"
	const isLarge = layout.family() === "large"
	header(w, { icon, title: format.truncate(name, isSmall ? 14 : 22) })
	w.addSpacer(4)

	const statsRow = [
		{ label: "Total", value: money.moneyShort(total) },
		{ label: "Per day", value: money.moneyShort(perDay) },
	]
	if (isLarge) statsRow.push({ label: "Projected", value: money.moneyShort(projected) })
	statRow(w, statsRow)

	if (!isSmall) {
		w.addSpacer(4)
		progressBar(w, { value: prog.progress })
	}
	w.addSpacer(4)
	footer(w, { left: `Day ${prog.currentDay}/${prog.daysInMonth}`, right: isLarge ? "Tap to open app" : "" })
	return w
})
