const format = importModule("lib/format")
const theme = importModule("lib/theme")
const layout = importModule("lib/layout")

const { t } = theme
const { font } = layout

module.exports = { header, stat, statRow, progressBar, listRow, chip, divider, card, footer }

function header(parent, { icon, title, subtitle }) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.spacing = 6
	// ponytail: len > 2 treats icon as SFSymbol name, else emoji text
	if (icon) {
		if (icon.length > 2) {
			const img = SFSymbol.named(icon).image
			img.tintColor = t("accent")
			const iconStack = row.addStack()
			iconStack.addImage(img)
			iconStack.imageSize = new Size(22, 22)
		} else {
			const e = row.addText(icon)
			e.font = font("medium", 16)
		}
	}
	const titleLabel = row.addText(title)
	titleLabel.font = font("semibold", 16)
	titleLabel.textColor = t("text")
	row.addSpacer()
	if (subtitle) {
		const sub = row.addText(subtitle)
		sub.font = font("regular", 12)
		sub.textColor = t("muted")
	}
	return row
}

function stat(parent, { label, value, color, emphasis }) {
	const stack = parent.addStack()
	stack.layoutVertically()
	stack.spacing = 2
	const labelEl = stack.addText(label)
	labelEl.font = font("regular", 11)
	labelEl.textColor = t("muted")
	const valueEl = stack.addText(String(value))
	valueEl.font = font(emphasis ? "bold" : "semibold", emphasis ? 24 : 18)
	valueEl.textColor = color || t("text")
	return stack
}

function statRow(parent, stats) {
	const row = parent.addStack()
	row.layoutHorizontally()
	stats.forEach((s, i) => {
		if (i > 0) row.addSpacer()
		stat(row, s)
		row.addSpacer()
	})
	return row
}

function progressBar(parent, { value, color }) {
	const label = parent.addText(format.blockBar(value))
	label.font = font("mono", 11)
	label.textColor = color || t("accent")
	return label
}

function listRow(parent, { emoji, title, amount, right, subtitle, color }) {
	const row = parent.addStack()
	row.layoutHorizontally()
	row.spacing = 6
	if (emoji) {
		const e = row.addText(emoji)
		e.font = font("regular", 14)
	}
	const textStack = row.addStack()
	textStack.layoutVertically()
	const titleLabel = textStack.addText(format.truncate(title, 18))
	titleLabel.font = font("semibold", 13)
	titleLabel.textColor = color ? new Color(color) : t("text")
	if (subtitle) {
		const sub = textStack.addText(subtitle)
		sub.font = font("regular", 11)
		sub.textColor = t("muted")
	}
	row.addSpacer()
	if (amount !== undefined && amount !== null) {
		const a = row.addText(String(amount))
		a.font = font("semibold", 13)
		a.textColor = color ? new Color(color) : t("text")
	} else if (right) {
		const r = row.addText(right)
		r.font = font("regular", 12)
		r.textColor = t("muted")
	}
	return row
}

function chip(parent, { text, color }) {
	const stack = parent.addStack()
	stack.cornerRadius = 6
	stack.setPadding(4, 8, 4, 8)
	stack.backgroundColor = color ? new Color(color, 0.15) : t("card")
	const label = stack.addText(text)
	label.font = font("semibold", 11)
	label.textColor = color ? new Color(color) : t("text")
	return stack
}

function divider(parent, color) {
	const line = parent.addStack()
	line.size = new Size(0, 1)
	line.backgroundColor = color || t("border")
	return line
}

function card(parent, { color } = {}) {
	const stack = parent.addStack()
	stack.layoutVertically()
	stack.cornerRadius = 14
	stack.setPadding(10, 10, 10, 10)
	stack.backgroundColor = color || t("card")
	return stack
}

function footer(parent, { left, right }) {
	const row = parent.addStack()
	row.layoutHorizontally()
	const l = row.addText(left)
	l.font = font("regular", 11)
	l.textColor = t("muted")
	row.addSpacer()
	const r = row.addText(right)
	r.font = font("regular", 11)
	r.textColor = t("muted")
	return row
}
