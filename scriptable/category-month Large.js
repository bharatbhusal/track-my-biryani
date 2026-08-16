// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
// Track My Biryani — category spending breakdown
// Shows monthly spending distribution by category.
//
// Large:
//   Header
//   Stacked category bar
//   Category legend/list
//
// Medium:
//   Header
//   Stacked category bar
//   Top categories
//
// Accessory:
//   Compact category summary

const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const moneyLib = importModule("lib/money")
const date = importModule("lib/date")

const { footer } = components
const { t } = theme
const { font } = layout
const { moneyShort, compact } = moneyLib
const { currentMonthRange } = date

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function safeColor(value) {
	try {
		return new Color(value || "#999999")
	} catch {
		return new Color("#999999")
	}
}

function normalizeCategories(items) {
	if (!Array.isArray(items)) {
		return []
	}

	return items
		.map((item) => ({
			name: item.name || "Other",
			emoji: item.emoji || "💸",
			color: item.color || "#999999",
			total: Number(item.total) || 0,
			pct: Number(item.pct) || 0,
			count: Number(item.count) || 0,
		}))
		.filter((item) => item.total > 0 && item.pct > 0)
		.sort((a, b) => b.total - a.total)
}

function stackedBar(parent, categories) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.size = new Size(0, 10)
	row.cornerRadius = 5

	if (!categories.length) {
		row.backgroundColor = t("border")
		return row
	}

	const totalPct = categories.reduce(
		(sum, category) => sum + category.pct,
		0
	)

	for (let i = 0; i < categories.length; i++) {
		const category = categories[i]

		const segment = row.addStack()

		// Use percentage as the relative width.
		// Since Scriptable doesn't support percentage widths,
		// calculate the width against a fixed reference width.
		const width = Math.max(
			1,
			Math.round(
				300 * (category.pct / Math.max(totalPct, 1))
			)
		)

		segment.size = new Size(width, 10)
		segment.backgroundColor = safeColor(category.color)

		// Round only the outside edges.
		if (i === 0 || i === categories.length - 1) {
			segment.cornerRadius = 5
		}
	}

	return row
}

function categoryRow(parent, category, showAmount = true) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.centerAlignContent()

	// Emoji
	const emoji = row.addText(category.emoji)
	emoji.font = font("regular", 14)

	row.addSpacer(6)

	// Category color indicator
	const indicator = row.addStack()
	indicator.size = new Size(4, 18)
	indicator.cornerRadius = 2
	indicator.backgroundColor = safeColor(category.color)

	row.addSpacer(7)

	// Category name
	const name = row.addText(category.name)
	name.font = font("regular", 10)
	name.textColor = t("text")
	name.lineLimit = 1

	row.addSpacer()

	// Amount
	if (showAmount) {
		const amount = row.addText(
			moneyShort(category.total)
		)
		amount.font = font("regular", 10)
		amount.textColor = t("muted")

		row.addSpacer(8)
	}

	// Percentage
	const pct = row.addText(`${category.pct}%`)
	pct.font = font("semibold", 10)
	pct.textColor = t("text")
	pct.rightAlignText()

	return row
}

function categoryCompactRow(parent, category) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.centerAlignContent()

	const emoji = row.addText(category.emoji)
	emoji.font = font("regular", 13)

	row.addSpacer(5)

	const name = row.addText(category.name)
	name.font = font("regular", 9)
	name.textColor = t("text")
	name.lineLimit = 1

	row.addSpacer()

	const pct = row.addText(`${category.pct}%`)
	pct.font = font("semibold", 9)
	pct.textColor = safeColor(category.color)

	return row
}

// ─────────────────────────────────────────────
// Widget
// ─────────────────────────────────────────────

bootstrap.run(async () => {
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()

	const family = layout.family()
	const isLarge = family === "large"
	const isMedium = family === "medium"
	const isAccessory = layout.isAccessory()

	// ─────────────────────────────────────────────
	// Date
	// ─────────────────────────────────────────────

	const { from, to } = currentMonthRange()

	// ─────────────────────────────────────────────
	// API
	// ─────────────────────────────────────────────

	const response = await endpoints.categoriesWithStats({
		from,
		to,
	})

	const categories = normalizeCategories(
		response
	)

	// ─────────────────────────────────────────────
	// Accessory widgets
	// ─────────────────────────────────────────────

	if (isAccessory) {
		if (!categories.length) {
			const empty = widget.addText("No spending")
			empty.font = font("regular", 10)
			empty.textColor = t("muted")
			return widget
		}

		const top = categories.slice(0, 3)

		for (let i = 0; i < top.length; i++) {
			categoryCompactRow(widget, top[i])

			if (i < top.length - 1) {
				widget.addSpacer(4)
			}
		}

		return widget
	}

	// ─────────────────────────────────────────────
	// Header
	// ─────────────────────────────────────────────

	const header = widget.addStack()
	header.layoutHorizontally()
	header.centerAlignContent()

	const title = header.addText("Where It Went")
	title.font = font("semibold", isLarge ? 15 : 14)
	title.textColor = t("text")

	header.addSpacer()

	const subtitle = header.addText("This Month")
	subtitle.font = font("regular", 9)
	subtitle.textColor = t("muted")

	// ─────────────────────────────────────────────
	// Empty state
	// ─────────────────────────────────────────────

	if (!categories.length) {
		widget.addSpacer(10)

		const empty = widget.addText(
			"No category spending yet"
		)
		empty.font = font("regular", 10)
		empty.textColor = t("muted")

		widget.addSpacer()

		footer(widget, {
			left: "This month",
			right: "₹0",
		})

		return widget
	}

	// ─────────────────────────────────────────────
	// Category selection
	// ─────────────────────────────────────────────

	let visibleCategories

	if (isLarge) {
		visibleCategories = categories.slice(0, 6)
	} else {
		visibleCategories = categories.slice(0, 4)
	}

	// ─────────────────────────────────────────────
	// Stacked bar
	// ─────────────────────────────────────────────

	widget.addSpacer(9)

	stackedBar(widget, categories)

	widget.addSpacer(10)

	// ─────────────────────────────────────────────
	// Category list
	// ─────────────────────────────────────────────

	for (let i = 0; i < visibleCategories.length; i++) {
		categoryRow(
			widget,
			visibleCategories[i],
			true
		)

		if (i < visibleCategories.length - 1) {
			widget.addSpacer(isLarge ? 6 : 5)
		}
	}

	// ─────────────────────────────────────────────
	// More categories indicator
	// ─────────────────────────────────────────────

	const remaining = categories.length - visibleCategories.length

	if (remaining > 0) {
		widget.addSpacer(5)

		const more = widget.addText(
			`+${remaining} more categor${remaining === 1 ? "y" : "ies"}`
		)
		more.font = font("regular", 8)
		more.textColor = t("muted")
	}

	// ─────────────────────────────────────────────
	// Footer
	// ─────────────────────────────────────────────

	widget.addSpacer()

	const totalSpend = categories.reduce(
		(sum, category) => sum + category.total,
		0
	)

	footer(widget, {
		left: `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`,
		right: compact(totalSpend),
	})

	return widget
})