// Month spend accessory (inline/circular/rectangular). Empty widget for non-accessory families.
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const theme = importModule("lib/theme")
const money = importModule("lib/money")
const date = importModule("lib/date")
const endpoints = importModule("api/endpoints")

bootstrap.run(async () => {
	if (!layout.isAccessory()) return new ListWidget()

	const { from, to } = date.currentMonthRange()
	const data = await endpoints.overview({ from, to })
	const stats = {}
	for (const s of data || []) stats[s.key] = s.value
	const total = Number(stats.total_spend) || 0
	const perDay = Number(stats.spend_per_day) || 0

	const w = new ListWidget()
	w.backgroundColor = theme.background()
	const f = layout.family()

	if (f === "accessoryInline") {
		w.addText(`💸 ${money.moneyShort(total)} this month`)
	} else if (f === "accessoryCircular") {
		const v = w.addText(money.moneyShort(total))
		v.font = layout.font("semibold", 18)
		v.textColor = theme.t("text")
		const s = w.addText("this mo")
		s.font = layout.font("regular", 10)
		s.textColor = theme.t("muted")
	} else {
		const t = w.addText(money.moneyShort(total))
		t.font = layout.font("semibold", 12)
		t.textColor = theme.t("text")
		const d = w.addText(`spend/day ${money.moneyShort(perDay)}`)
		d.font = layout.font("regular", 11)
		d.textColor = theme.t("muted")
	}
	return w
})
