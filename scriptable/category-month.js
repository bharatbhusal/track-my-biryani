// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
// Track My Biryani — category spending breakdown
// Shows monthly spending distribution by category.
//
// ─────────────────────────────────────────────
// WIDGET PARAMETER
// ─────────────────────────────────────────────
//
// Set the Scriptable widget parameter to a
// bucket ID.
//
// Example:
//
// 6a73518db8201292042ce736
//
// The widget automatically resolves the bucket
// name using the /buckets API.
//
// No bucket IDs or names are hardcoded here.
//
// ─────────────────────────────────────────────
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
//
// ─────────────────────────────────────────────

const endpoints = importModule("api/endpoints")
const bootstrap = importModule("lib/bootstrap")
const layout = importModule("lib/layout")
const components = importModule("lib/components")
const theme = importModule("lib/theme")
const moneyLib = importModule("lib/money")
const date = importModule("lib/date")

const { footer, stackedCategoryBar, categoryBar, categoryCompactBar } = components
const { t } = theme
const { font } = layout
const { moneyShort, compact } = moneyLib
const { currentMonthRange } = date


// ─────────────────────────────────────────────
// Widget parameter
// ─────────────────────────────────────────────

const bucketId =
	String(args.widgetParameter || "").trim()


// ─────────────────────────────────────────────
// Widget
// ─────────────────────────────────────────────

bootstrap.run(async () => {
	const widget =
		new ListWidget()

	widget.backgroundColor =
		theme.background()


	const family =
		layout.family()

	const isLarge =
		family === "large"

	const isMedium =
		family === "medium"

	const isAccessory =
		layout.isAccessory()


	// ─────────────────────────────────────────
	// Validate bucket parameter
	// ─────────────────────────────────────────

	if (!bucketId) {

		const title =
			widget.addText(
				"Track My Biryani"
			)

		title.font =
			font("semibold", 14)

		title.textColor =
			t("text")


		widget.addSpacer(5)


		const message =
			widget.addText(
				"Set a bucket ID in Widget Parameter"
			)

		message.font =
			font("regular", 10)

		message.textColor =
			t("muted")

		return widget
	}


	// ─────────────────────────────────────────
	// Fetch bucket details
	// ─────────────────────────────────────────

	const bucketsResponse =
		await endpoints.buckets()


	const buckets =
		Array.isArray(bucketsResponse?.items)
			? bucketsResponse.items
			: []


	const bucket =
		buckets.find(
			(item) =>
				item &&
				item._id === bucketId
		)


	// ─────────────────────────────────────────
	// Validate bucket
	// ─────────────────────────────────────────

	if (!bucket) {

		const title =
			widget.addText(
				"Bucket Not Found"
			)

		title.font =
			font("semibold", 14)

		title.textColor =
			t("text")


		widget.addSpacer(5)


		const message =
			widget.addText(
				bucketId
			)

		message.font =
			font("regular", 9)

		message.textColor =
			t("muted")

		message.lineLimit = 2

		return widget
	}


	const bucketName =
		bucket.name || "Bucket"


	// ─────────────────────────────────────────
	// Date
	// ─────────────────────────────────────────

	const {
		from,
		to,
	} = currentMonthRange()


	// ─────────────────────────────────────────
	// API
	// ─────────────────────────────────────────

	const response =
		await endpoints.categoriesWithStats({
			from,
			to,
			bucketId,
		})


	const categories =
		response || []


	// ─────────────────────────────────────────
	// Accessory widgets
	// ─────────────────────────────────────────

	if (isAccessory) {

		if (!categories.length) {

			const empty =
				widget.addText(
					"No spending"
				)

			empty.font =
				font("regular", 10)

			empty.textColor =
				t("muted")

			return widget
		}


		const top =
			categories.slice(0, 3)


		for (
			let i = 0;
			i < top.length;
			i++
		) {
			categoryCompactBar(
				widget,
				top[i]
			)


			if (
				i < top.length - 1
			) {
				widget.addSpacer(4)
			}
		}


		return widget
	}


	// ─────────────────────────────────────────
	// Header
	// ─────────────────────────────────────────

	const header =
		widget.addStack()

	header.layoutHorizontally()
	header.centerAlignContent()


	const title =
		header.addText(
			`Where It Went · ${bucketName}`
		)

	title.font =
		font(
			"semibold",
			isLarge ? 15 : 14
		)

	title.textColor =
		t("text")

	title.lineLimit = 1


	header.addSpacer()


	const subtitle =
		header.addText(
			"This Month"
		)

	subtitle.font =
		font("regular", 9)

	subtitle.textColor =
		t("muted")


	// ─────────────────────────────────────────
	// Empty state
	// ─────────────────────────────────────────

	if (!categories.length) {

		widget.addSpacer(10)


		const empty =
			widget.addText(
				"No category spending yet"
			)

		empty.font =
			font("regular", 10)

		empty.textColor =
			t("muted")


		widget.addSpacer()


		footer(widget, {
			left: bucketName,
			right: "₹0",
		})


		return widget
	}


	// ─────────────────────────────────────────
	// Category selection
	// ─────────────────────────────────────────

	let visibleCategories


	if (isLarge) {
		visibleCategories =
			categories.slice(0, 10)
	} else {
		visibleCategories =
			categories.slice(0, 4)
	}


	// ─────────────────────────────────────────
	// Stacked bar
	// ─────────────────────────────────────────

	widget.addSpacer(9)


	stackedCategoryBar(
		widget,
		categories
	)


	widget.addSpacer(10)


	// ─────────────────────────────────────────
	// Category list
	// ─────────────────────────────────────────

	for (
		let i = 0;
		i < visibleCategories.length;
		i++
	) {
		categoryBar(
			widget,
			visibleCategories[i],
			true
		)


		if (
			i <
			visibleCategories.length - 1
		) {
			widget.addSpacer(
				isLarge ? 6 : 5
			)
		}
	}


	// ─────────────────────────────────────────
	// More categories
	// ─────────────────────────────────────────

	const remaining =
		categories.length -
		visibleCategories.length


	if (remaining > 0) {

		widget.addSpacer(5)


		const more =
			widget.addText(
				`+${remaining} more categor${
					remaining === 1
						? "y"
						: "ies"
				}`
			)

		more.font =
			font("regular", 8)

		more.textColor =
			t("muted")
	}


	// ─────────────────────────────────────────
	// Footer
	// ─────────────────────────────────────────

	widget.addSpacer()


	const totalSpend =
		categories.reduce(
			(sum, category) =>
				sum + category.total,
			0
		)


	footer(widget, {
		left:
			`${categories.length} categor${
				categories.length === 1
					? "y"
					: "ies"
			}`,

		right:
			moneyShort(totalSpend),
	})


	return widget
})