const config = importModule("config")
const debug = importModule("lib/debug")
const theme = importModule("lib/theme")
const format = importModule("lib/format")
const layout = importModule("lib/layout")

module.exports = { run, renderError }

async function run(build) {
	try {
		const client = importModule("api/client")
		await client.ensureSession()
		const widget = await build()
		const now = new Date()
		widget.refreshAfterDate = new Date(now.getTime() + config.REFRESH_MINUTES * 60000)
		Script.setWidget(widget)
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
