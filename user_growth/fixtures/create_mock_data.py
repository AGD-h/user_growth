import random
from datetime import date, timedelta

import frappe


REGIONS = {
    "华东": ["上海", "杭州", "南京", "苏州"],
    "华南": ["广州", "深圳", "厦门", "佛山"],
    "华北": ["北京", "天津", "石家庄", "太原"],
    "西南": ["成都", "重庆", "昆明", "贵阳"],
    "西北": ["西安", "兰州", "银川", "乌鲁木齐"],
    "东北": ["沈阳", "大连", "长春", "哈尔滨"],
    "海外": ["东京", "新加坡", "首尔", "曼谷"],
}


CHANNELS = ["广告投放", "自然搜索", "社交媒体", "朋友推荐", "线下活动", "合作渠道"]

SERVICE_PLANS = ["Basic", "Pro", "Enterprise"]

CHURN_REASONS = ["价格原因", "功能不足", "转用竞品", "服务体验差", "短期试用结束", "其他"]

PLAN_FEES = {
    "Basic": 99,
    "Pro": 299,
    "Enterprise": 999,
}


def random_date_within_days(days: int) -> date:
    return date.today() - timedelta(days=random.randint(0, days))


def execute(records: int = 120, replace_existing: bool = False):
    doctype = "User Service Record"

    existing_count = frappe.db.count(doctype)
    if existing_count:
        if not replace_existing:
            print(f"Skipped mock data: {existing_count} {doctype} records already exist.")
            return
        frappe.db.delete(doctype)

    random.seed(20260624)

    for index in range(1, records + 1):
        region = random.choice(list(REGIONS.keys()))
        city = random.choice(REGIONS[region])
        channel = random.choice(CHANNELS)
        service_plan = random.choice(SERVICE_PLANS)
        opened_on = random_date_within_days(365)

        is_churned = random.random() < 0.28
        churned_on = None
        churn_reason = None

        if is_churned:
            churned_on = opened_on + timedelta(days=random.randint(15, 240))

            if churned_on > date.today():
                churned_on = date.today()

            churn_reason = random.choice(CHURN_REASONS)

        doc = frappe.get_doc({
            "doctype": doctype,
            "user_id": f"U{index:04d}",
            "user_name": f"Mock User {index:03d}",
            "region": region,
            "city": city,
            "channel": channel,
            "service_plan": service_plan,
            "opened_on": opened_on,
            "status": "Churned" if is_churned else "Active",
            "churned_on": churned_on,
            "churn_reason": churn_reason,
            "monthly_fee": PLAN_FEES[service_plan],
            "remark": "Generated mock data for user growth analysis.",
        })

        doc.insert(ignore_permissions=True)

    frappe.db.commit()
    print(f"Created {records} mock {doctype} records.")