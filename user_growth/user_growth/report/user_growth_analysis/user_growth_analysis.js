// Copyright (c) 2026, HANZEREN and contributors
// For license information, please see license.txt

const UG_REPORT_STYLE_ID = "ug-analysis-report-style";

frappe.query_reports["User Growth Analysis"] = {
	filters: [],

	onload(report) {
		ensure_report_theme(report);
		setTimeout(() => enhance_report(report), 0);
	},

	after_datatable_render() {
		if (frappe.query_report) {
			enhance_report(frappe.query_report);
		}
	},

	get_chart_data(columns, result) {
		if (!result || !result.length) return;

		return {
			data: {
				labels: result.map((row) => row.month),
				datasets: [
					{
						name: __("新增用户"),
						values: result.map((row) => cint(row.new_users)),
						chartType: "line",
					},
					{
						name: __("流失用户"),
						values: result.map((row) => cint(row.churned_users)),
						chartType: "line",
					},
					{
						name: __("净增长"),
						values: result.map((row) => cint(row.net_growth)),
						chartType: "bar",
					},
				],
			},
			type: "axis-mixed",
			colors: ["#4f7cff", "#f43f5e", "#bfd0ff"],
			barOptions: {
				spaceRatio: 0.4,
			},
		};
	},

	formatter(value, row, column, data, default_formatter) {
		const formatted = default_formatter(value, row, column, data);

		if (!data) return formatted;

		if (column.fieldname === "net_growth") {
			const net = cint(data.net_growth);
			const tone = net >= 0 ? "#15803d" : "#be123c";
			const bg = net >= 0 ? "rgba(34,197,94,.10)" : "rgba(244,63,94,.10)";
			return `<span class="ug-report-pill" style="color:${tone};background:${bg}">${net > 0 ? "+" : ""}${net}</span>`;
		}

		if (column.fieldname === "churn_rate") {
			const rate = flt(data.churn_rate);
			const tone = rate >= 10 ? "#be123c" : rate >= 6 ? "#b45309" : "#1d4ed8";
			return `<span style="color:${tone};font-weight:700">${formatted}</span>`;
		}

		if (column.fieldname === "new_users" || column.fieldname === "active_users") {
			return `<span style="color:#1e3a8a;font-weight:700">${formatted}</span>`;
		}

		return formatted;
	},
};

function ensure_report_theme(report) {
	if (!document.getElementById(UG_REPORT_STYLE_ID)) {
		$("head").append(`
			<style id="${UG_REPORT_STYLE_ID}">
				.ug-analysis-shell {
					--ug-primary: #4f7cff;
					--ug-green: #22c55e;
					--ug-red: #f43f5e;
					--ug-amber: #f59e0b;
					--ug-ink: #172033;
					--ug-body: #475569;
					--ug-muted: #94a3b8;
					--ug-border: #e6edf7;
					padding: 14px 16px 24px;
					border-radius: 22px;
					background: linear-gradient(145deg, rgba(255,255,255,.70), rgba(245,249,255,.86));
					box-shadow: 0 14px 44px rgba(39,76,119,.07);
				}
				.ug-analysis-hero {
					display: grid;
					grid-template-columns: minmax(0, 1.7fr) minmax(420px, .9fr);
					column-gap: 16px;
					row-gap: 0;
					margin-bottom: 16px;
					align-items: stretch;
				}
				.ug-analysis-card,
				.ug-analysis-shell .report-chart,
				.ug-analysis-shell .report-summary,
				.ug-analysis-shell .datatable,
				.ug-analysis-shell .dt-scrollable,
				.ug-analysis-shell .dt-freeze {
					background: rgba(255,255,255,.78);
					border: 1px solid rgba(255,255,255,.94);
					border-radius: 18px;
					box-shadow: 0 10px 32px rgba(39,76,119,.075);
					backdrop-filter: blur(16px);
					-webkit-backdrop-filter: blur(16px);
				}
				.ug-analysis-head {
					padding: 16px 22px 12px;
					position: relative;
					overflow: hidden;
					min-height: 0;
					height: 100%;
					align-self: stretch;
				}
				.ug-analysis-head::after {
					content: "";
					position: absolute;
					inset: auto -18px -26px auto;
					width: 138px;
					height: 138px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(79,124,255,.17), rgba(79,124,255,0));
					pointer-events: none;
				}
				.ug-analysis-eyebrow {
					color: var(--ug-primary);
					font-size: 12px;
					font-weight: 700;
					letter-spacing: .08em;
				}
				.ug-analysis-title {
					margin-top: 6px;
					color: var(--ug-ink);
					font-size: 24px;
					line-height: 1.1;
					font-weight: 800;
				}
				.ug-analysis-copy {
					display: none;
				}
				.ug-analysis-meta {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 12px;
					max-width: 680px;
				}
				.ug-analysis-badge {
					padding: 7px 11px;
					border-radius: 999px;
					background: #eef3ff;
					color: #4b63b8;
					font-size: 11px;
					font-weight: 700;
					line-height: 1.2;
				}
				.ug-trend-chip {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					font-weight: 800;
					white-space: nowrap;
				}
				.ug-trend-chip.up {
					color: #15803d;
				}
				.ug-trend-chip.down {
					color: #be123c;
				}
				.ug-trend-chip.flat {
					color: #64748b;
				}
				.ug-trend-arrow {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 14px;
					height: 14px;
					border-radius: 999px;
					font-size: 9px;
					line-height: 1;
				}
				.ug-trend-chip.up .ug-trend-arrow {
					background: rgba(34,197,94,.14);
				}
				.ug-trend-chip.down .ug-trend-arrow {
					background: rgba(244,63,94,.12);
				}
				.ug-trend-chip.flat .ug-trend-arrow {
					background: rgba(148,163,184,.14);
				}
				.ug-analysis-side {
					padding: 18px;
					display: grid;
					gap: 10px;
					align-self: stretch;
					position: static;
					margin: 0;
					height: 100%;
					grid-template-rows: auto 1fr;
				}
				.ug-analysis-side-title {
					color: var(--ug-ink);
					font-size: 16px;
					font-weight: 800;
					line-height: 1.2;
				}
				.ug-analysis-side-copy {
					display: none;
				}
				.ug-analysis-snapshot {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 10px;
				}
				.ug-analysis-metric {
					padding: 16px 18px 14px;
					border-radius: 14px;
					background: linear-gradient(180deg, rgba(248,251,255,.95), rgba(241,246,255,.85));
					border: 1px solid var(--ug-border);
					min-height: 120px;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
				}
				.ug-analysis-metric-label {
					color: var(--ug-muted);
					font-size: 12px;
					line-height: 1.35;
				}
				.ug-analysis-metric-value {
					margin-top: 8px;
					color: var(--ug-ink);
					font-size: 24px;
					font-weight: 800;
					line-height: 1.08;
				}
				.ug-analysis-metric-foot {
					margin-top: 10px;
					color: #64748b;
					font-size: 11px;
					line-height: 1.45;
				}
				.ug-analysis-shell .report-summary {
					display: none !important;
				}
				.ug-analysis-shell .report-chart {
					margin-bottom: 16px;
					padding: 12px 14px 4px;
					border: 1px solid rgba(226,234,246,.9);
				}
				.ug-analysis-content-grid {
					display: grid;
					grid-template-columns: 1fr;
					gap: 14px;
					align-items: stretch;
				}
				.ug-analysis-content-grid .report-wrapper {
					min-width: 0;
					display: flex;
					flex-direction: column;
				}
				.ug-report-table-card {
					padding: 0;
					overflow: hidden;
				}
				.ug-report-table {
					width: 100%;
					border-collapse: separate;
					border-spacing: 0;
					table-layout: fixed;
				}
				.ug-report-table thead th {
					padding: 16px 18px;
					background: linear-gradient(180deg, #f8fbff, #f1f6fd);
					color: #64748b;
					font-size: 13px;
					font-weight: 700;
					text-align: center;
					border-bottom: 1px solid #e8eef7;
					border-right: 1px solid #edf2fa;
				}
				.ug-report-table thead th:first-child {
					width: 72px;
				}
				.ug-report-table thead th:nth-child(2) {
					width: 160px;
					text-align: left;
				}
				.ug-report-table tbody td {
					padding: 15px 18px;
					color: #334155;
					font-size: 14px;
					border-bottom: 1px solid #edf2fa;
					border-right: 1px solid #edf2fa;
					text-align: center;
					background: rgba(255,255,255,.74);
				}
				.ug-report-table tbody tr:nth-child(even) td {
					background: rgba(247,250,255,.8);
				}
				.ug-report-table tbody td:nth-child(2) {
					text-align: left;
				}
				.ug-report-table tbody td.is-strong {
					color: #1e3a8a;
					font-weight: 700;
				}
				.ug-report-table tbody td.is-rate-low {
					color: #1d4ed8;
					font-weight: 700;
				}
				.ug-report-table tbody td.is-rate-mid {
					color: #b45309;
					font-weight: 700;
				}
				.ug-report-table tbody td.is-rate-high {
					color: #be123c;
					font-weight: 700;
				}
				.ug-report-index {
					color: #334155;
					font-variant-numeric: tabular-nums;
				}
				.ug-analysis-shell .chart-title {
					color: var(--ug-ink);
					font-weight: 800;
				}
				.ug-analysis-shell .chart-wrapper {
					border-radius: 16px;
				}
				.ug-ai-panel {
					padding: 20px;
					min-height: 0;
					height: auto;
					display: flex;
					flex-direction: column;
					align-self: auto;
				}
				.ug-ai-head {
					display: flex;
					align-items: flex-start;
					justify-content: space-between;
					gap: 10px;
				}
				.ug-ai-title {
					color: var(--ug-ink);
					font-size: 16px;
					font-weight: 800;
				}
				.ug-ai-badge {
					padding: 5px 9px;
					border-radius: 999px;
					background: #eef3ff;
					color: #4b63b8;
					font-size: 11px;
					font-weight: 700;
					white-space: nowrap;
				}
				.ug-ai-subtitle {
					margin-top: 4px;
					color: #718198;
					font-size: 12px;
				}
				.ug-ai-body {
					margin-top: 16px;
					display: grid;
					gap: 10px;
					align-content: start;
				}
				.ug-ai-item {
					padding: 14px 15px;
					border-radius: 14px;
					background: linear-gradient(180deg, rgba(248,251,255,.98), rgba(241,246,255,.88));
					border: 1px solid #e8eef7;
					color: #415066;
					font-size: 13px;
					line-height: 1.72;
					white-space: normal;
				}
				.ug-ai-item-label {
					display: inline-flex;
					margin-right: 6px;
					color: #4f7cff;
					font-weight: 800;
				}
				.ug-ai-loading {
					min-height: 240px;
					display: grid;
					place-items: center;
					color: #8b9ab0;
					font-size: 13px;
				}
				.ug-report-pill {
					display: inline-flex;
					align-items: center;
					padding: 4px 8px;
					border-radius: 999px;
					font-size: 11px;
					font-weight: 800;
				}
				@media (max-width: 980px) {
					.ug-analysis-hero {
						grid-template-columns: 1fr;
						row-gap: 14px;
					}
					.ug-ai-panel {
						min-height: auto;
						height: auto;
					}
				}
				@media (max-width: 640px) {
					.ug-analysis-shell {
						padding: 10px 10px 18px;
						border-radius: 16px;
					}
					.ug-analysis-title {
						font-size: 24px;
					}
					.ug-analysis-snapshot {
						grid-template-columns: 1fr;
					}
				}
			</style>
		`);
	}

	if (report.page && report.page.main) {
		$(report.page.main).addClass("ug-analysis-shell");
	}
}

function enhance_report(report) {
	if (!report || !report.page || !report.raw_data) return;

	ensure_report_theme(report);

	const rows = report.data || report.raw_data.result || [];
	const summary = build_summary(report, rows);
	const latest = rows.at(-1) || {};
	const previous = rows.at(-2) || {};
	const delta = cint(latest.new_users) - cint(previous.new_users);
	const activeDelta = cint(latest.active_users) - cint(previous.active_users);
	const status = build_status(latest);
	const $main = $(report.page.main);

	if (!$main.find(".ug-analysis-hero").length) {
		$(report.$summary).before(`<div class="ug-analysis-hero"></div>`);
	}

	$main.find(".ug-analysis-hero").html(`
		<section class="ug-analysis-card ug-analysis-head">
			<div class="ug-analysis-eyebrow">${__("USER GROWTH ANALYSIS")}</div>
			<div class="ug-analysis-title">${__("用户增长分析")}</div>
			<div class="ug-analysis-meta">
				<span class="ug-analysis-badge">${__("最新月份")} ${frappe.utils.escape_html(latest.month || "--")}</span>
				<span class="ug-analysis-badge">${__("新增变化")} ${trend_html(delta)}</span>
				<span class="ug-analysis-badge">${__("活跃变化")} ${trend_html(activeDelta)}</span>
				<span class="ug-analysis-badge">${__("增长状态")} ${status.text}</span>
			</div>
		</section>
		<aside class="ug-analysis-card ug-analysis-side">
			<div>
				<div class="ug-analysis-side-title">${__("本期快照")}</div>
			</div>
			<div class="ug-analysis-snapshot">
				${metric_card(__("累计用户"), summary.total_users, __("当前样本规模"))}
				${metric_card(__("活跃用户"), cint(latest.active_users), `${__("较上月")} ${trend_html(activeDelta)}`)}
				${metric_card(__("本月净增长"), trend_html(cint(latest.net_growth)), status.hint)}
				${metric_card(__("本月流失率"), `${flt(latest.churn_rate).toFixed(1)}%`, status.note)}
			</div>
		</aside>
	`);

	ensure_ai_panel(report);
	render_report_table(report, rows);
	load_ai_insight(report);
}

function ensure_ai_panel(report) {
	const $main = $(report.page.main);
	let $grid = $main.find(".ug-analysis-content-grid");
	if (!$grid.length) {
		$grid = $('<div class="ug-analysis-content-grid"></div>');
		$(report.$report).before($grid);
		$grid.append(report.$report);
		$grid.append(`
			<aside class="ug-ai-panel ug-analysis-card">
				<div class="ug-ai-head">
					<div>
						<div class="ug-ai-title">${__("AI 分析")}</div>
						<div class="ug-ai-subtitle">${__("基于最近增长数据的简短判断")}</div>
					</div>
					<span class="ug-ai-badge" data-ai-provider>${__("分析中")}</span>
				</div>
				<div class="ug-ai-body" data-ai-body>
					<div class="ug-ai-loading">${__("正在生成摘要...")}</div>
				</div>
			</aside>
		`);
	} else if (!$grid.find(".ug-ai-panel").length) {
		$grid.append(`
			<aside class="ug-ai-panel ug-analysis-card">
				<div class="ug-ai-head">
					<div>
						<div class="ug-ai-title">${__("AI 分析")}</div>
						<div class="ug-ai-subtitle">${__("基于最近增长数据的简短判断")}</div>
					</div>
					<span class="ug-ai-badge" data-ai-provider>${__("分析中")}</span>
				</div>
				<div class="ug-ai-body" data-ai-body>
					<div class="ug-ai-loading">${__("正在生成摘要...")}</div>
				</div>
			</aside>
		`);
	}
}

function render_report_table(report, rows) {
	const $report = $(report.$report);
	$report.empty().html(`
		<div class="ug-report-table-card ug-analysis-card">
			<table class="ug-report-table">
				<thead>
					<tr>
						<th>#</th>
						<th>${__("月份")}</th>
						<th>${__("新增用户")}</th>
						<th>${__("流失用户")}</th>
						<th>${__("净增长")}</th>
						<th>${__("活跃用户")}</th>
						<th>${__("流失率")}</th>
					</tr>
				</thead>
				<tbody>
					${rows.map((row, index) => report_table_row(row, index)).join("")}
				</tbody>
			</table>
		</div>
	`);
}

function report_table_row(row, index) {
	const rate = flt(row.churn_rate);
	const rateClass = rate >= 10 ? "is-rate-high" : rate >= 6 ? "is-rate-mid" : "is-rate-low";
	return `
		<tr>
			<td class="ug-report-index">${index + 1}</td>
			<td>${frappe.utils.escape_html(row.month || "--")}</td>
			<td class="is-strong">${cint(row.new_users)}</td>
			<td>${cint(row.churned_users)}</td>
			<td>${net_growth_cell(row.net_growth)}</td>
			<td class="is-strong">${cint(row.active_users)}</td>
			<td class="${rateClass}">${rate.toFixed(2)}%</td>
		</tr>
	`;
}

function net_growth_cell(value) {
	const net = cint(value);
	const tone = net >= 0 ? "#15803d" : "#be123c";
	const bg = net >= 0 ? "rgba(34,197,94,.10)" : "rgba(244,63,94,.10)";
	return `<span class="ug-report-pill" style="color:${tone};background:${bg}">${net > 0 ? "+" : ""}${net}</span>`;
}

function load_ai_insight(report) {
	const rows = report.data || report.raw_data?.result || [];
	const signature = JSON.stringify(rows.map((row) => [row.month, row.new_users, row.churned_users, row.net_growth, row.active_users, row.churn_rate]));
	if (report.__ug_ai_signature === signature && report.__ug_ai_loaded) {
		return;
	}

	report.__ug_ai_signature = signature;
	report.__ug_ai_loaded = true;
	const $main = $(report.page.main);
	$main.find("[data-ai-provider]").text(__("分析中"));
	$main.find("[data-ai-body]").html(`<div class="ug-ai-loading">${__("正在生成摘要...")}</div>`);

	frappe.call({
		method: "user_growth.user_growth.report.user_growth_analysis.user_growth_analysis.get_ai_insight",
		callback: (response) => render_ai_insight(report, response.message || {}),
		error: () => render_ai_insight(report, {
			provider: "local",
			status: "error",
			title: __("AI 摘要"),
			items: [__("摘要生成失败，请稍后重试。")],
		}),
	});
}

function render_ai_insight(report, payload) {
	const $main = $(report.page.main);
	const providerText = payload.provider === "deepseek" ? "DeepSeek" : __("本地摘要");
	const items = (payload.items || []).slice(0, 3);
	$main.find("[data-ai-provider]").text(providerText);
	$main.find("[data-ai-body]").html(`
		${items.map((item, index) => `
			<div class="ug-ai-item">
				<span class="ug-ai-item-label">${index + 1}.</span>${frappe.utils.escape_html(item)}
			</div>
		`).join("")}
	`);
}

function build_summary(report, rows) {
	const reportSummary = report.raw_data.report_summary || [];
	const totalUsersCard = reportSummary.find((item) => item.label === "用户总数");

	return {
		total_users: totalUsersCard ? cint(totalUsersCard.value) : rows.reduce((max, row) => Math.max(max, cint(row.active_users)), 0),
	};
}

function build_status(latest) {
	const net = cint(latest.net_growth);
	const churn = flt(latest.churn_rate);

	if (net > 0 && churn < 8) {
		return {
			text: __("健康"),
			hint: __("新增大于流失"),
			note: __("流失率较低"),
		};
	}

	if (net < 0 || churn >= 10) {
		return {
			text: __("风险"),
			hint: __("需要排查流失"),
			note: __("关注留存转化"),
		};
	}

	return {
		text: __("关注中"),
		hint: __("增长波动存在"),
		note: __("建议持续观察"),
	};
}

function metric_card(label, value, foot) {
	return `
		<div class="ug-analysis-metric">
			<div class="ug-analysis-metric-label">${label}</div>
			<div class="ug-analysis-metric-value">${value}</div>
			<div class="ug-analysis-metric-foot">${foot}</div>
		</div>
	`;
}

function signed(value) {
	const number = cint(value);
	return `${number > 0 ? "+" : ""}${number}`;
}

function trend_html(value) {
	const number = cint(value);
	const direction = number > 0 ? "up" : number < 0 ? "down" : "flat";
	const arrow = number > 0 ? "↑" : number < 0 ? "↓" : "•";
	const text = number > 0 ? `+${number}` : `${number}`;
	return `<span class="ug-trend-chip ${direction}"><span class="ug-trend-arrow">${arrow}</span><span>${text}</span></span>`;
}

function cint(value) {
	return Number(value || 0);
}

function flt(value) {
	return Number(value || 0);
}
