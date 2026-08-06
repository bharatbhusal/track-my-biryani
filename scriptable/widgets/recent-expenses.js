// Track My Biryani — recent-expenses widget
// Latest 5 expenses.
const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const money = importModule("lib/money")
const date = importModule("lib/date")

const { header, listRow, footer } = components
const { t } = theme
const { moneyShort } = money
const { relativeDay } = date

bootstrap.run(async () => {
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()

	const { items, total } = await endpoints.expenses({ limit: 5 })

	header(widget, { icon: "🧾", title: "Recent" })
	if (!items.length) {
		const empty = widget.addText("No expenses yet")
		empty.font = layout.font("regular", 12)
		empty.textColor = t("muted")
		return widget
	}
	for (const e of items) {
		listRow(widget, {
			emoji: e.categoryEmoji,
			title: e.title,
			amount: moneyShort(e.amount),
			subtitle: relativeDay(e.paidAt),
		})
	}
	if (layout.mode() === "expanded") {
		footer(widget, { left: `${total} total`, right: "updated now" })
	}
	return widget
})
