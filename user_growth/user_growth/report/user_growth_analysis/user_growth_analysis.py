from datetime import date

import frappe
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
		{"label": "Month", "fieldname": "month", "fieldtype": "Data", "width": 120},
		{"label": "New Users", "fieldname": "new_users", "fieldtype": "Int", "width": 120},
		{"label": "Churned Users", "fieldname": "churned_users", "fieldtype": "Int", "width": 140},
		{"label": "Net Growth", "fieldname": "net_growth", "fieldtype": "Int", "width": 120},
		{"label": "Active Users", "fieldname": "active_users", "fieldtype": "Int", "width": 120},
		{"label": "Churn Rate", "fieldname": "churn_rate", "fieldtype": "Percent", "width": 120},
	]


def get_chart(data):
	return {
		"data": {
			"labels": [row["month"] for row in data],
			"datasets": [
				{"name": "New Users", "values": [row["new_users"] for row in data]},
				{"name": "Churned Users", "values": [row["churned_users"] for row in data]},
				{"name": "Net Growth", "values": [row["net_growth"] for row in data]},
			],
		},
		"type": "line",
		"height": 280,
		"colors": ["#2490ef", "#e24c4c", "#28a745"],
	}


def get_summary(data):
	latest = data[-1] if data else {}
	return [
		{"label": "Total Users", "value": frappe.db.count("User Service Record"), "indicator": "Blue"},
		{"label": "Active Users", "value": latest.get("active_users", 0), "indicator": "Green"},
		{"label": "Latest Net Growth", "value": latest.get("net_growth", 0), "indicator": "Blue"},
		{
			"label": "Latest Churn Rate",
			"value": latest.get("churn_rate", 0),
			"datatype": "Percent",
			"indicator": "Red",
		},
	]
