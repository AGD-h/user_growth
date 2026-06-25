from datetime import date

import frappe
import requests
from frappe.utils import add_months, getdate


def execute(filters=None):
	columns = get_columns()
	records = frappe.get_all(
		"User Service Record",
		fields=["opened_on", "churned_on"],
		order_by="opened_on asc",
	)

	if not records:
		return columns, [], None, get_chart([]), get_summary([])

	start_month = getdate(records[0].opened_on).replace(day=1)
	current_month = date.today().replace(day=1)
	data = []

	while start_month <= current_month:
		next_month = add_months(start_month, 1)
		new_users = sum(
			1 for row in records if row.opened_on and start_month <= getdate(row.opened_on) < next_month
		)
		churned_users = sum(
			1 for row in records if row.churned_on and start_month <= getdate(row.churned_on) < next_month
		)
		opening_users = sum(
			1
			for row in records
			if row.opened_on
			and getdate(row.opened_on) < start_month
			and (not row.churned_on or getdate(row.churned_on) >= start_month)
		)
		active_users = sum(
			1
			for row in records
			if row.opened_on
			and getdate(row.opened_on) < next_month
			and (not row.churned_on or getdate(row.churned_on) >= next_month)
		)

		data.append(
			{
				"month": start_month.strftime("%Y-%m"),
				"new_users": new_users,
				"churned_users": churned_users,
				"net_growth": new_users - churned_users,
				"active_users": active_users,
				"churn_rate": round(churned_users / opening_users * 100, 2) if opening_users else 0,
			}
		)
		start_month = next_month

	return columns, data, None, get_chart(data), get_summary(data)


def get_columns():
	return [
		{"label": "月份", "fieldname": "month", "fieldtype": "Data", "width": 140},
		{"label": "新增用户", "fieldname": "new_users", "fieldtype": "Int", "width": 130},
		{"label": "流失用户", "fieldname": "churned_users", "fieldtype": "Int", "width": 130},
		{"label": "净增长", "fieldname": "net_growth", "fieldtype": "Int", "width": 130},
		{"label": "活跃用户", "fieldname": "active_users", "fieldtype": "Int", "width": 130},
		{"label": "流失率", "fieldname": "churn_rate", "fieldtype": "Percent", "width": 140},
	]


def get_chart(data):
	return {
		"data": {
			"labels": [row["month"] for row in data],
			"datasets": [
				{"name": "新增用户", "values": [row["new_users"] for row in data]},
				{"name": "流失用户", "values": [row["churned_users"] for row in data]},
				{"name": "净增长", "values": [row["net_growth"] for row in data]},
			],
		},
		"type": "line",
		"height": 280,
		"colors": ["#2490ef", "#e24c4c", "#28a745"],
	}


def get_summary(data):
	latest = data[-1] if data else {}
	return [
		{"label": "用户总数", "value": frappe.db.count("User Service Record"), "indicator": "Blue"},
		{"label": "活跃用户", "value": latest.get("active_users", 0), "indicator": "Green"},
		{"label": "本月净增长", "value": latest.get("net_growth", 0), "indicator": "Blue"},
		{
			"label": "本月流失率",
			"value": latest.get("churn_rate", 0),
			"datatype": "Percent",
			"indicator": "Red",
		},
	]


@frappe.whitelist()
def get_ai_insight():
	_, data, _, _, _ = execute()
	if not data:
		return {
			"provider": "local",
			"status": "empty",
			"title": "暂无数据",
			"items": ["当前没有可分析的用户增长数据。"],
		}

	local_result = build_local_ai_insight(data)
	api_key = frappe.conf.get("deepseek_api_key")
	if not api_key:
		return local_result

	try:
		return call_deepseek_for_insight(data, api_key)
	except Exception:
		frappe.log_error(frappe.get_traceback(), "User Growth AI Insight")
		return local_result


def call_deepseek_for_insight(data, api_key):
	base_url = (frappe.conf.get("deepseek_base_url") or "https://api.deepseek.com").rstrip("/")
	model = frappe.conf.get("deepseek_model") or "deepseek-chat"
	headers = {
		"Authorization": f"Bearer {api_key}",
		"Content-Type": "application/json",
	}
	payload = {
		"model": model,
		"temperature": 0.3,
		"max_tokens": 220,
		"messages": [
			{
				"role": "system",
				"content": (
					"你是用户增长分析助手。请基于给定月度数据输出极简中文结论。"
					"返回严格 JSON："
					'{"title":"...","items":["...","...","..."]}。'
					"items 最多 3 条，每条控制在 24 到 40 个汉字，不要空话，要有判断。"
				),
			},
			{
				"role": "user",
				"content": build_ai_prompt(data),
			},
		],
		"response_format": {"type": "json_object"},
	}
	response = requests.post(
		f"{base_url}/chat/completions",
		json=payload,
		headers=headers,
		timeout=20,
	)
	response.raise_for_status()
	content = response.json()["choices"][0]["message"]["content"]
	result = frappe.parse_json(content) or {}
	items = [str(item).strip() for item in (result.get("items") or []) if str(item).strip()][:3]
	if not items:
		items = build_local_ai_insight(data)["items"]

	return {
		"provider": "deepseek",
		"status": "ok",
		"model": model,
		"title": result.get("title") or "AI 摘要",
		"items": items,
	}


def build_ai_prompt(data):
	rows = data[-6:]
	lines = [
		f'{row["month"]}: 新增{row["new_users"]}, 流失{row["churned_users"]}, 净增长{row["net_growth"]}, 活跃{row["active_users"]}, 流失率{row["churn_rate"]}%'
		for row in rows
	]
	return "以下是最近 6 个月用户增长数据，请输出稍微完整一点的短句分析，重点看新增、流失、净增长、活跃与风险变化：\n" + "\n".join(lines)


def build_local_ai_insight(data):
	latest = data[-1]
	previous = data[-2] if len(data) > 1 else {}
	net = latest.get("net_growth", 0)
	churn_rate = latest.get("churn_rate", 0)
	new_delta = latest.get("new_users", 0) - previous.get("new_users", 0)
	active_delta = latest.get("active_users", 0) - previous.get("active_users", 0)

	items = []
	if net >= 0:
		items.append(f'{latest["month"]} 净增长 {net:+d}，整体仍保持正增长，但需要继续观察后续动能。')
	else:
		items.append(f'{latest["month"]} 净增长 {net}，当月已经出现净流失，增长趋势明显转弱。')

	if churn_rate >= 10:
		items.append(f"流失率 {churn_rate:.2f}% 已处于偏高水平，建议优先排查留存与服务稳定性。")
	else:
		items.append(f"流失率 {churn_rate:.2f}% 仍在可控区间，下一步更应关注新增质量与转化效率。")

	if new_delta >= 0 and active_delta >= 0:
		items.append(f"新增 {new_delta:+d}、活跃 {active_delta:+d}，当前增长与活跃表现相对稳定。")
	else:
		items.append(f"新增 {new_delta:+d}、活跃 {active_delta:+d}，近期新增承压且活跃走弱，需要尽快干预。")

	return {
		"provider": "local",
		"status": "fallback",
		"title": "AI 摘要",
		"items": items[:3],
	}
