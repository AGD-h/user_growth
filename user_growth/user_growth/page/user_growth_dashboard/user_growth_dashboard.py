from collections import Counter
from datetime import date

import frappe
from frappe.utils import getdate

from user_growth.user_growth.report.user_growth_analysis.user_growth_analysis import execute as run_growth_report


@frappe.whitelist()
def get_dashboard_data():
	records = frappe.get_all(
		"User Service Record",
		fields=["opened_on", "status", "churned_on", "region", "channel"],
	)
	_, trend, _, _, _ = run_growth_report()
	current_month = date.today().replace(day=1)

	return {
		"summary": {
			"total_users": len(records),
			"active_users": sum(1 for row in records if row.status == "Active"),
			"churned_users": sum(1 for row in records if row.status == "Churned"),
			"new_users_this_month": sum(
				1 for row in records if row.opened_on and getdate(row.opened_on) >= current_month
			),
		},
		"trend": trend,
		"regions": counter_data(records, "region"),
		"region_details": get_region_details(records, current_month),
		"channels": counter_data(records, "channel"),
	}


def counter_data(records, fieldname):
	counter = Counter(row.get(fieldname) or "未填写" for row in records)
	return [{"label": label, "value": value} for label, value in counter.most_common()]


def get_region_details(records, current_month):
	details = {}

	for row in records:
		region = row.region or "未填写"
		item = details.setdefault(
			region,
			{
				"region": region,
				"total_users": 0,
				"active_users": 0,
				"churned_users": 0,
				"new_users_this_month": 0,
				"channels": Counter(),
			},
		)
		item["total_users"] += 1
		item["active_users"] += int(row.status == "Active")
		item["churned_users"] += int(row.status == "Churned")
		item["new_users_this_month"] += int(
			bool(row.opened_on) and getdate(row.opened_on) >= current_month
		)
		item["channels"][row.channel or "未填写"] += 1

	result = []
	for item in details.values():
		total = item["total_users"]
		item["active_rate"] = round(item["active_users"] / total * 100, 1) if total else 0
		item["churn_rate"] = round(item["churned_users"] / total * 100, 1) if total else 0
		item["top_channel"] = item["channels"].most_common(1)[0][0] if item["channels"] else "—"
		del item["channels"]
		result.append(item)

	return sorted(result, key=lambda row: row["total_users"], reverse=True)
