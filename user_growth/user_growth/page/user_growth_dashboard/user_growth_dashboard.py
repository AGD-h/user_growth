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
		"channels": counter_data(records, "channel"),
	}


def counter_data(records, fieldname):
	counter = Counter(row.get(fieldname) or "???" for row in records)
	return [{"label": label, "value": value} for label, value in counter.most_common()]
