const cfg = importModule("config")
const debug = importModule("lib/debug")
const theme = importModule("lib/theme")
const format = importModule("lib/format")
const layout = importModule("lib/layout")
const date = importModule("lib/date")

module.exports = { run, renderError }

async function run(build) {
	try {
		const client = importModule("api/client")
		await client.ensureSession()
		const widget = await build()
		widget.url = cfg.WEBSITE_URL
		addRefreshFooter(widget)
		const now = new Date()
		widget.refreshAfterDate = new Date(now.getTime() + cfg.REFRESH_MINUTES * 60000)
		Script.setWidget(widget)
		// ponytail: runsInWidget is Scriptable's GLOBAL config, not our settings module
		if (!config.runsInWidget) {
			const f = layout.family()
			const fn = f === "large" || f === "extraLarge" ? "presentLarge" : f === "small" ? "presentSmall" : "presentMedium"
			await widget[fn]()
		}
		Script.complete()
	} catch (e) {
		renderError(e)
		Script.complete()
	}
}

// ponytail: tiny accessory slots have no room for a footer line
function addRefreshFooter(widget) {
	if (widget.noRefreshFooter) return
	if (layout.isAccessory() && layout.family() !== "accessoryRectangular") return
	const label = widget.addText(`Refreshed ${date.formatClock24(new Date())}`)
	label.font = layout.font("regular", 10)
	label.textColor = theme.t("muted")
	label.rightAlignText()
}

function renderError(e) {
	debug.log(e)
	const widget = new ListWidget()
	widget.backgroundColor = theme.background()
	const title = widget.addText(format.truncate(String(e.message || e), 60))
	title.font = layout.font("semibold", 14)
	title.textColor = theme.t("danger")
	const hint = widget.addText("Check DEBUG logs. Set RESET_CREDENTIALS=true in config.js to re-enter credentials.")
	hint.font = layout.font("regular", 10)
	hint.textColor = theme.t("muted")
	Script.setWidget(widget)
	return widget
}
