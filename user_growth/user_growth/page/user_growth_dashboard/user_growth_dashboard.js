frappe.pages["user_growth_dashboard"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("\u7528\u6237\u589e\u957f\u6570\u636e\u5927\u5c4f"),
		single_column: true,
	});
	page.set_primary_action(__("\u5237\u65b0"), () => load_dashboard(wrapper), "refresh");
	build_dashboard(wrapper);
	load_dashboard(wrapper);
};

frappe.pages["user_growth_dashboard"].refresh = function (wrapper) {
	load_dashboard(wrapper);
};

function build_dashboard(wrapper) {
	$(wrapper).find(".layout-main-section").html(`
		<style>
			.layout-main-section-wrapper { padding: 0 22px 28px !important; }
			.user-growth-dashboard {
				--primary: #4f7cff; --sky: #38bdf8; --green: #22c55e; --red: #f43f5e;
				--amber: #f59e0b; --ink: #172033; --body: #475569; --muted: #94a3b8;
				min-height: calc(100vh - 150px); padding: 22px; border-radius: 18px;
				background: linear-gradient(145deg, #f7f9fd 0%, #edf3fb 100%); color: var(--body);
			}
			.ug-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
			.ug-intro { font-size: 13px; color: #64748b; }
			.ug-meta { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 8px 16px; font-size: 12px; color: var(--muted); }
			.ug-live { display: inline-flex; align-items: center; gap: 7px; color: #16a34a; font-weight: 600; }
			.ug-live::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.12); }
			.ug-card {
				background: rgba(255,255,255,.78); border: 1px solid rgba(255,255,255,.92);
				box-shadow: 0 10px 35px rgba(39,76,119,.075); backdrop-filter: blur(16px);
				-webkit-backdrop-filter: blur(16px); border-radius: 16px;
				transition: transform .22s ease, box-shadow .22s ease;
			}
			.ug-card:hover { transform: translateY(-2px); box-shadow: 0 14px 38px rgba(39,76,119,.11); }
			.ug-kpis { display: grid; grid-template-columns: repeat(4, minmax(170px, 1fr)); gap: 14px; margin-bottom: 14px; }
			.ug-kpi { padding: 18px; min-height: 132px; }
			.ug-kpi-head { display: flex; align-items: center; justify-content: space-between; }
			.ug-kpi-label { color: #64748b; font-size: 13px; font-weight: 600; }
			.ug-kpi-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; background: var(--soft); color: var(--accent); }
			.ug-kpi-value { margin-top: 13px; color: var(--ink); font-size: 34px; line-height: 1; font-weight: 750; letter-spacing: -.8px; }
			.ug-kpi-foot { margin-top: 11px; display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 11px; }
			.ug-kpi-change { color: var(--accent); font-weight: 700; }
			.ug-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(300px, .7fr); gap: 14px; }
			.ug-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
			.ug-panel { padding: 20px; min-height: 400px; }
			.ug-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
			.ug-panel-title { color: var(--ink); font-size: 15px; font-weight: 700; }
			.ug-panel-subtitle { color: var(--muted); font-size: 11px; margin-top: 4px; }
			.ug-badge { padding: 5px 9px; border-radius: 999px; background: #eef3ff; color: #4f6fcd; font-size: 11px; white-space: nowrap; }
			.ug-chart-wrap { min-height: 310px; position: relative; }
			.ug-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; font-size: 11px; color: #64748b; }
			.ug-legend span { display: inline-flex; align-items: center; gap: 6px; }
			.ug-legend i { width: 9px; height: 9px; border-radius: 3px; }
			.ug-status-box { padding: 16px; border-radius: 14px; background: linear-gradient(135deg,#f8fbff,#f3f7ff); border: 1px solid #e8eef8; }
			.ug-status-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
			.ug-status-name { color: var(--ink); font-size: 20px; font-weight: 750; }
			.ug-status-pill { padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
			.ug-status-reason { margin-top: 9px; color: #64748b; font-size: 12px; line-height: 1.7; }
			.ug-status-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-top: 14px; }
			.ug-mini { padding: 13px 10px; border-radius: 12px; background: #fff; border: 1px solid #edf1f7; text-align: center; }
			.ug-mini-label { color: var(--muted); font-size: 10px; }
			.ug-mini-value { margin-top: 5px; color: var(--ink); font-size: 17px; font-weight: 750; }
			.ug-insight { margin-top: 14px; padding: 14px; border-left: 3px solid var(--primary); border-radius: 0 12px 12px 0; background: rgba(79,124,255,.055); color: #526173; font-size: 12px; line-height: 1.7; }
			.ug-region-panel { grid-column: 1 / -1; min-height: 520px; }
			.ug-region-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, .55fr); gap: 18px; min-height: 420px; }
			.ug-map-shell { position: relative; min-height: 420px; border-radius: 14px; overflow: hidden; background: linear-gradient(145deg,#f8fbff,#eef4fc); border: 1px solid #e7edf7; }
			.ug-map-canvas { width: 100%; height: 420px; }
			.ug-region-side { display: grid; grid-template-rows: auto 1fr; gap: 12px; min-height: 420px; }
			.ug-region-focus { padding: 16px; border-radius: 14px; background: linear-gradient(135deg,#f8faff,#f1f5ff); border: 1px solid #e5ebf8; }
			.ug-region-focus-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
			.ug-region-focus-title { color: var(--ink); font-size: 18px; font-weight: 750; }
			.ug-region-focus-subtitle { margin-top: 4px; color: var(--muted); font-size: 10px; }
			.ug-region-focus-value { color: var(--primary); font-size: 27px; font-weight: 760; white-space: nowrap; }
			.ug-region-focus-value small { color: var(--muted); font-size: 10px; font-weight: 500; margin-left: 3px; }
			.ug-region-focus-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-top: 13px; }
			.ug-region-focus-grid div { padding: 9px 6px; border-radius: 9px; background: rgba(255,255,255,.78); text-align: center; }
			.ug-region-focus-grid span { display: block; color: var(--muted); font-size: 9px; }
			.ug-region-focus-grid strong { display: block; margin-top: 4px; color: var(--ink); font-size: 13px; }
			.ug-bars3d { display: flex; align-items: flex-end; justify-content: space-around; gap: 7px; min-height: 245px; padding: 28px 12px 22px; border-radius: 14px; background: linear-gradient(180deg,#fbfcff,#f3f7fc); border: 1px solid #e8eef7; perspective: 700px; }
			.ug-bar3d-item { flex: 1; min-width: 34px; max-width: 64px; display: grid; justify-items: center; gap: 8px; cursor: pointer; }
			.ug-bar3d-stage { position: relative; width: 28px; height: 170px; display: flex; align-items: flex-end; }
			.ug-bar3d { --height: 50%; position: relative; width: 28px; height: var(--height); min-height: 8px; border-radius: 2px 2px 4px 4px; background: linear-gradient(180deg,#7699ff,#4f7cff); box-shadow: 0 9px 16px rgba(79,124,255,.2); transition: height .45s ease, filter .2s ease, transform .2s ease; transform: rotateY(-5deg); }
			.ug-bar3d::before { content: ""; position: absolute; left: 4px; right: -7px; top: -7px; height: 8px; background: #a7bcff; transform: skewX(-42deg); border-radius: 2px 3px 1px 1px; }
			.ug-bar3d::after { content: ""; position: absolute; top: -3px; bottom: 3px; right: -7px; width: 8px; background: linear-gradient(180deg,#3d64d8,#3156c2); transform: skewY(-42deg); transform-origin: left top; border-radius: 0 2px 3px 0; }
			.ug-bar3d-item:hover .ug-bar3d, .ug-bar3d-item.is-active .ug-bar3d { filter: saturate(1.2) brightness(1.07); transform: rotateY(-5deg) translateY(-5px); }
			.ug-bar3d-value { color: #40506a; font-size: 11px; font-weight: 700; }
			.ug-bar3d-label { color: #7d8da4; font-size: 10px; white-space: nowrap; }
			.ug-channel-layout { display: grid; grid-template-columns: 230px 1fr; align-items: center; gap: 12px; min-height: 310px; }
			.ug-channel-panel { grid-column: 1 / -1; }
			.ug-donut-stage { position: relative; display: grid; place-items: center; min-height: 260px; }
			.ug-donut { width: 220px; height: 220px; transform: rotate(-90deg); }
			.ug-donut-segment { transition: opacity .2s ease, stroke-width .2s ease; cursor: pointer; }
			.ug-donut-segment:hover { opacity: 1 !important; stroke-width: 30; }
			.ug-donut-center { position: absolute; text-align: center; pointer-events: none; }
			.ug-donut-center strong { display: block; color: var(--ink); font-size: 30px; line-height: 1; }
			.ug-donut-center span { display: block; margin-top: 7px; color: var(--muted); font-size: 11px; }
			.ug-channel-list { display: grid; gap: 8px; }
			.ug-channel-row { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 10px; transition: background .2s ease; }
			.ug-channel-row:hover { background: #f6f8fc; }
			.ug-channel-dot { width: 8px; height: 8px; border-radius: 50%; }
			.ug-channel-name { color: #526173; font-size: 12px; }
			.ug-channel-value { color: var(--ink); font-size: 12px; font-weight: 700; }
			.ug-channel-value small { margin-left: 5px; color: var(--muted); font-weight: 400; }
			.ug-empty { min-height: 240px; display: grid; place-items: center; color: var(--muted); font-size: 13px; }
			@media (max-width: 1100px) { .ug-grid,.ug-bottom { grid-template-columns: 1fr; } }
			@media (max-width: 900px) { .ug-region-layout { grid-template-columns: 1fr; } .ug-region-side { min-height: auto; } }
			@media (max-width: 820px) { .ug-kpis { grid-template-columns: 1fr 1fr; } .ug-channel-layout { grid-template-columns: 1fr; } }
			@media (max-width: 520px) { .layout-main-section-wrapper { padding:0 10px 18px!important; } .user-growth-dashboard { padding:14px; } .ug-toolbar { align-items:flex-start; flex-direction:column; } .ug-meta { justify-content:flex-start; } .ug-kpis { grid-template-columns:1fr; } .ug-status-metrics { grid-template-columns:1fr; } }
		</style>
		<div class="user-growth-dashboard">
			<div class="ug-toolbar">
				<div class="ug-intro">${__("\u805a\u7126\u65b0\u589e\u3001\u6d41\u5931\u4e0e\u6e20\u9053\u8d28\u91cf\uff0c\u5feb\u901f\u5224\u65ad\u7528\u6237\u589e\u957f\u662f\u5426\u5065\u5eb7\u3002")}</div>
				<div class="ug-meta"><span class="ug-live">${__("\u6570\u636e\u5df2\u8fde\u63a5")}</span><span>${__("\u6570\u636e\u622a\u81f3")} <strong data-cutoff>--</strong></span><span>${__("\u66f4\u65b0\u4e8e")} <strong data-updated>--</strong></span></div>
			</div>
			<div class="ug-kpis">
				${kpi_card("total_users","\u7528\u6237\u603b\u6570","\u7d2f\u8ba1\u670d\u52a1\u7528\u6237","#4f7cff","#edf2ff","users")}
				${kpi_card("active_users","\u6d3b\u8dc3\u7528\u6237","\u5f53\u524d\u6709\u6548\u7528\u6237","#22c55e","#ecfdf3","pulse")}
				${kpi_card("new_users_this_month","\u672c\u6708\u65b0\u589e","\u5f53\u6708\u65b0\u5f00\u901a\u7528\u6237","#4f7cff","#edf2ff","plus")}
				${kpi_card("churned_this_month","\u672c\u6708\u6d41\u5931","\u5f53\u6708\u53d1\u751f\u6d41\u5931","#f43f5e","#fff0f3","down")}
			</div>
			<div class="ug-grid">
				<section class="ug-panel ug-card"><div class="ug-panel-head"><div><div class="ug-panel-title">${__("\u7528\u6237\u589e\u957f\u8d8b\u52bf")}</div><div class="ug-panel-subtitle">${__("\u65b0\u589e\u4e0e\u6d41\u5931\u8d8b\u52bf\uff0c\u51c0\u589e\u957f\u4ee5\u67f1\u72b6\u8868\u793a")}</div></div><span class="ug-badge" data-current-month>--</span></div><div class="ug-chart-wrap" data-trend-chart></div><div class="ug-legend"><span><i style="background:#4f7cff"></i>${__("\u65b0\u589e\u7528\u6237")}</span><span><i style="background:#f43f5e"></i>${__("\u6d41\u5931\u7528\u6237")}</span><span><i style="background:#a7c1ff"></i>${__("\u51c0\u589e\u957f")}</span></div></section>
				<section class="ug-panel ug-card"><div class="ug-panel-head"><div><div class="ug-panel-title">${__("\u589e\u957f\u72b6\u6001")}</div><div class="ug-panel-subtitle">${__("\u6839\u636e\u51c0\u589e\u957f\u548c\u6d41\u5931\u7387\u5224\u65ad")}</div></div></div><div data-growth-status></div></section>
			</div>
			<div class="ug-bottom">
				<section class="ug-panel ug-card ug-region-panel">
					<div class="ug-panel-head"><div><div class="ug-panel-title">${__("\u4e2d\u56fd\u7528\u6237\u5730\u533a\u70ed\u529b\u5206\u5e03")}</div></div></div>
					<div class="ug-region-layout">
						<div class="ug-map-shell"><div class="ug-map-canvas" data-region-map></div></div>
						<div class="ug-region-side"><div class="ug-region-focus" data-region-focus></div><div class="ug-bars3d" data-region-bars></div></div>
					</div>
				</section>
				<section class="ug-panel ug-card ug-channel-panel"><div class="ug-panel-head"><div><div class="ug-panel-title">${__("\u83b7\u5ba2\u6e20\u9053\u5206\u5e03")}</div><div class="ug-panel-subtitle">${__("\u6e20\u9053\u7528\u6237\u6570\u4e0e\u5360\u6bd4")}</div></div></div><div class="ug-channel-layout"><div class="ug-donut-stage" data-channel-chart></div><div class="ug-channel-list" data-channel-list></div></div></section>
			</div>
		</div>
	`);
}

function kpi_card(key,label,note,accent,soft,icon) {
	return `<article class="ug-kpi ug-card" style="--accent:${accent};--soft:${soft}"><div class="ug-kpi-head"><span class="ug-kpi-label">${__(label)}</span><span class="ug-kpi-icon">${icon_svg(icon)}</span></div><div class="ug-kpi-value" data-kpi="${key}">-</div><div class="ug-kpi-foot"><span>${__(note)}</span><span class="ug-kpi-change" data-kpi-change="${key}"></span></div></article>`;
}

function icon_svg(type) {
	const icons={users:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M18 8h4M20 6v4"/></svg>',pulse:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>',plus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',down:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 7 6 6 4-4 6 6M20 10v5h-5"/></svg>'};
	return icons[type] || "";
}

function load_dashboard(wrapper) {
	frappe.call({method:"user_growth.user_growth.page.user_growth_dashboard.user_growth_dashboard.get_dashboard_data",freeze:true,freeze_message:__("\u6b63\u5728\u52a0\u8f7d\u6570\u636e..."),callback:(response)=>render_dashboard(wrapper,response.message || {}),error:()=>show_error(wrapper)});
}

function render_dashboard(wrapper,data) {
	const $root=$(wrapper);
	const trend=data.trend || [];
	const latest=trend.at(-1) || {};
	const previous=trend.at(-2) || {};
	const summary={...(data.summary || {}),churned_this_month:Number(latest.churned_users || 0)};
	Object.entries(summary).forEach(([key,value])=>$root.find(`[data-kpi="${key}"]`).text(Number(value || 0).toLocaleString()));
	animate_numbers($root,summary);
	const cutoff=frappe.datetime.get_today();
	$root.find("[data-cutoff]").text(cutoff);
	$root.find("[data-updated]").text(frappe.datetime.now_datetime().slice(11,16));
	$root.find("[data-current-month]").text(`${latest.month || "--"} ${__("\u622a\u81f3\u4eca\u65e5")}`);
	const new_delta=Number(latest.new_users || 0)-Number(previous.new_users || 0);
	const active_delta=Number(latest.active_users || 0)-Number(previous.active_users || 0);
	$root.find('[data-kpi-change="new_users_this_month"]').text(`${signed(new_delta)} ${__("\u8f83\u4e0a\u6708")}`);
	$root.find('[data-kpi-change="active_users"]').text(`${active_delta>=0?"+":""}${active_delta}`);
	$root.find('[data-kpi-change="churned_this_month"]').text(`${Number(latest.churn_rate || 0).toFixed(1)}%`);
	if (!trend.length) { show_empty($root); return; }
	render_trend($root.find("[data-trend-chart]")[0],trend);
	render_growth_status($root.find("[data-growth-status]")[0],latest,previous);
	render_region_visual(
		$root.find("[data-region-map]")[0],
		$root.find("[data-region-focus]")[0],
		$root.find("[data-region-bars]")[0],
		data.region_details || []
	);
	render_channels($root.find("[data-channel-chart]")[0],$root.find("[data-channel-list]")[0],data.channels || []);
}

function render_trend(element,rows) {
	if (!element) return;
	const width=900,height=300,p={l:44,r:22,t:28,b:42};
	const values=rows.flatMap(r=>[Number(r.new_users||0),Number(r.churned_users||0),Number(r.net_growth||0)]);
	const min=Math.min(0,...values),max=Math.max(1,...values),range=max-min || 1;
	const x=i=>p.l+(width-p.l-p.r)*(rows.length===1?.5:i/(rows.length-1));
	const y=v=>p.t+(height-p.t-p.b)*(max-v)/range;
	const zero=y(0),barWidth=Math.max(9,Math.min(22,(width-p.l-p.r)/rows.length*.42));
	const grid=Array.from({length:5},(_,i)=>{const value=max-range*i/4,py=y(value);return `<g><line x1="${p.l}" y1="${py}" x2="${width-p.r}" y2="${py}" stroke="#e7edf5"/><text x="${p.l-10}" y="${py+4}" text-anchor="end" fill="#94a3b8" font-size="10">${Math.round(value)}</text></g>`;}).join("");
	const bars=rows.map((r,i)=>{const value=Number(r.net_growth||0),py=y(value),top=Math.min(py,zero),h=Math.max(2,Math.abs(zero-py));return `<rect x="${x(i)-barWidth/2}" y="${top}" width="${barWidth}" height="${h}" rx="4" fill="${value>=0?'#b9ccff':'#fecdd6'}"><title>${r.month} ${__("\u51c0\u589e\u957f")}: ${value}</title></rect>`;}).join("");
	const line=(key,color,dash="")=>`<path d="${rows.map((r,i)=>`${i?'L':'M'} ${x(i)} ${y(Number(r[key]||0))}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
	const dots=(key,color)=>rows.map((r,i)=>`<circle cx="${x(i)}" cy="${y(Number(r[key]||0))}" r="3" fill="#fff" stroke="${color}" stroke-width="2"><title>${r.month}: ${r[key]}</title></circle>`).join("");
	const labels=rows.map((r,i)=>i%2===0||i===rows.length-1?`<text x="${x(i)}" y="${height-14}" text-anchor="middle" fill="#94a3b8" font-size="10">${r.month}</text>`:'').join("");
	const markers=highlight_markers(rows,x,y);
	element.innerHTML=`<svg viewBox="0 0 ${width} ${height}" width="100%" height="310" role="img">${grid}<line x1="${p.l}" y1="${zero}" x2="${width-p.r}" y2="${zero}" stroke="#cbd5e1"/>${bars}${line('new_users','#4f7cff')}${line('churned_users','#f43f5e','6 5')}${dots('new_users','#4f7cff')}${dots('churned_users','#f43f5e')}${markers}${labels}</svg>`;
}

function highlight_markers(rows,x,y) {
	const points=[];
	['new_users','churned_users'].forEach((key,series)=>{const vals=rows.map(r=>Number(r[key]||0));const indexes=new Set([vals.indexOf(Math.max(...vals)),vals.indexOf(Math.min(...vals)),vals.length-1]);indexes.forEach(i=>points.push(`<g><rect x="${x(i)-17}" y="${y(vals[i])-28}" width="34" height="19" rx="7" fill="${series?'#fff0f3':'#edf2ff'}"/><text x="${x(i)}" y="${y(vals[i])-15}" text-anchor="middle" fill="${series?'#e11d48':'#4169d8'}" font-size="10" font-weight="700">${vals[i]}</text></g>`));});
	return points.join("");
}

function render_growth_status(element,latest,previous) {
	if (!element) return;
	const net=Number(latest.net_growth||0),churn=Number(latest.churn_rate||0),activeChange=Number(latest.active_users||0)-Number(previous.active_users||0);
	let status,color,bg,reason;
	if(net>0&&churn<8){status=__("\u5065\u5eb7");color="#15803d";bg="#dcfce7";reason=__("\u51c0\u589e\u957f\u4fdd\u6301\u4e3a\u6b63\uff0c\u6d41\u5931\u7387\u5904\u4e8e\u8f83\u4f4e\u6c34\u5e73\u3002");}
	else if(net<0&&churn>=10){status=__("\u98ce\u9669");color="#be123c";bg="#ffe4e9";reason=__("\u672c\u6708\u6d41\u5931\u4eba\u6570\u9ad8\u4e8e\u65b0\u589e\u4eba\u6570\uff0c\u5efa\u8bae\u4f18\u5148\u6392\u67e5\u6d41\u5931\u539f\u56e0\u3002");}
	else{status=__("\u9700\u8981\u5173\u6ce8");color="#b45309";bg="#fef3c7";reason=__("\u51c0\u589e\u957f\u6216\u6d41\u5931\u7387\u5b58\u5728\u6ce2\u52a8\uff0c\u5efa\u8bae\u6301\u7eed\u89c2\u5bdf\u3002");}
	element.innerHTML=`<div class="ug-status-box"><div class="ug-status-top"><div class="ug-status-name">${status}</div><span class="ug-status-pill" style="color:${color};background:${bg}">${latest.month||'--'}</span></div><div class="ug-status-reason">${reason}</div></div><div class="ug-status-metrics"><div class="ug-mini"><div class="ug-mini-label">${__("\u672c\u6708\u51c0\u589e\u957f")}</div><div class="ug-mini-value" style="color:${net>=0?'#16a34a':'#e11d48'}">${signed(net)}</div></div><div class="ug-mini"><div class="ug-mini-label">${__("\u6d3b\u8dc3\u53d8\u5316")}</div><div class="ug-mini-value">${signed(activeChange)}</div></div><div class="ug-mini"><div class="ug-mini-label">${__("\u672c\u6708\u6d41\u5931\u7387")}</div><div class="ug-mini-value">${churn.toFixed(1)}%</div></div></div><div class="ug-insight"><strong>${__("\u6570\u636e\u89e3\u8bfb\uff1a")}</strong>${reason}</div>`;
}

var ug_china_map_promise;
var ug_province_region = {
	"北京市":"华北","天津市":"华北","河北省":"华北","山西省":"华北","内蒙古自治区":"华北","河南省":"华北",
	"辽宁省":"东北","吉林省":"东北","黑龙江省":"东北",
	"上海市":"华东","江苏省":"华东","浙江省":"华东","安徽省":"华东","福建省":"华东","江西省":"华东","山东省":"华东",
	"广东省":"华南","广西壮族自治区":"华南","海南省":"华南","湖北省":"华南","湖南省":"华南","香港特别行政区":"华南","澳门特别行政区":"华南","台湾省":"华南",
	"重庆市":"西南","四川省":"西南","贵州省":"西南","云南省":"西南","西藏自治区":"西南",
	"陕西省":"西北","甘肃省":"西北","青海省":"西北","宁夏回族自治区":"西北","新疆维吾尔自治区":"西北"
};

function ensure_china_map() {
	if (window.echarts && echarts.getMap("china")) return Promise.resolve();
	if (!ug_china_map_promise) {
		ug_china_map_promise = frappe.require("/assets/user_growth/js/echarts.min.js")
			.then(() => fetch("/assets/user_growth/geo/china.json"))
			.then((response) => {
				if (!response.ok) throw new Error("China map data could not be loaded");
				return response.json();
			})
			.then((geojson) => echarts.registerMap("china", geojson));
	}
	return ug_china_map_promise;
}

function render_region_visual(map_element, focus_element, bars_element, rows) {
	if (!map_element || !focus_element || !bars_element) return;
	if (!rows.length) {
		map_element.innerHTML = empty_text();
		focus_element.innerHTML = empty_text();
		bars_element.innerHTML = "";
		return;
	}

	const details = Object.fromEntries(rows.map((row) => [row.region, row]));
	const total = rows.reduce((sum, row) => sum + Number(row.total_users || 0), 0);
	const max = Math.max(1, ...rows.map((row) => Number(row.total_users || 0)));
	const overall = {
		region: __("全国整体"),
		total_users: total,
		active_users: rows.reduce((sum, row) => sum + Number(row.active_users || 0), 0),
		churned_users: rows.reduce((sum, row) => sum + Number(row.churned_users || 0), 0),
		new_users_this_month: rows.reduce((sum, row) => sum + Number(row.new_users_this_month || 0), 0),
		top_channel: rows[0]?.top_channel || "—",
	};
	overall.active_rate = overall.total_users ? overall.active_users / overall.total_users * 100 : 0;
	overall.churn_rate = overall.total_users ? overall.churned_users / overall.total_users * 100 : 0;

	const update_focus = (detail, province = "") => {
		render_region_focus(focus_element, detail || overall, province);
		bars_element.querySelectorAll(".ug-bar3d-item").forEach((item) => {
			item.classList.toggle("is-active", Boolean(detail) && item.dataset.region === detail.region);
		});
	};

	bars_element.innerHTML = rows.map((row) => {
		const height = Math.max(8, Number(row.total_users || 0) / max * 100);
		return `<div class="ug-bar3d-item" data-region="${frappe.utils.escape_html(row.region)}"><span class="ug-bar3d-value">${row.total_users}</span><div class="ug-bar3d-stage"><div class="ug-bar3d" style="--height:${height.toFixed(1)}%"></div></div><span class="ug-bar3d-label">${frappe.utils.escape_html(row.region)}</span></div>`;
	}).join("");
	update_focus(null);

	ensure_china_map().then(() => {
		const map_data = Object.entries(ug_province_region).map(([province, region]) => ({
			name: province,
			value: Number(details[region]?.total_users || 0),
			region,
		}));
		if (map_element._ug_chart) map_element._ug_chart.dispose();
		const chart = echarts.init(map_element, null, {renderer: "canvas"});
		map_element._ug_chart = chart;
		chart.setOption({
			animationDuration: 650,
			tooltip: {
				trigger: "item",
				backgroundColor: "rgba(255,255,255,.96)",
				borderColor: "#dce5f3",
				borderWidth: 1,
				padding: [10, 12],
				textStyle: {color: "#334155", fontSize: 12},
				extraCssText: "box-shadow:0 10px 28px rgba(39,76,119,.14);border-radius:10px;",
				formatter: (params) => {
					const region = params.data?.region;
					const detail = details[region];
					if (!detail) return params.name;
					return `<strong>${params.name}</strong><br/><span style="color:#94a3b8">所属大区</span> ${region}<br/><span style="color:#94a3b8">大区用户</span> ${detail.total_users} 人`;
				},
			},
			visualMap: {
				min: 0,
				max,
				show: false,
				orient: "horizontal",
				right: 18,
				bottom: 18,
				itemWidth: 90,
				itemHeight: 7,
				text: [__("高"), __("低")],
				textStyle: {color: "#7c8ca2", fontSize: 10},
				calculable: false,
				inRange: {color: ["#edf3ff", "#bfd1ff", "#789cff", "#4f7cff"]},
			},
			series: [{
				name: __("用户地区热力"),
				type: "map",
				map: "china",
				roam: false,
				zoom: 1.08,
				selectedMode: false,
				label: {show: false},
				labelLayout: {
					hideOverlap: false,
					moveOverlap: "shiftY",
					draggable: false,
				},
				labelLine: {
					show: true,
					length2: 12,
					lineStyle: {color: "#8294ad", width: 1},
				},
				itemStyle: {areaColor: "#eef3fb", borderColor: "#ffffff", borderWidth: 1.2},
				emphasis: {
					label: {
						show: true,
						color: "#334155",
						fontSize: 10,
						fontWeight: 700,
						backgroundColor: "rgba(255,255,255,.88)",
						borderColor: "#dce5f3",
						borderWidth: 1,
						borderRadius: 5,
						padding: [3, 5],
					},
					labelLine: {
						show: true,
						length: 8,
						length2: 14,
						lineStyle: {color: "#71839c", width: 1},
					},
					itemStyle: {areaColor: "#ffcf70", borderColor: "#ffffff", borderWidth: 1.8, shadowBlur: 18, shadowColor: "rgba(245,158,11,.28)"},
				},
				select: {disabled: true},
				data: map_data,
			}],
		});

		chart.on("mouseover", (params) => {
			const detail = details[params.data?.region];
			if (detail) {
				update_focus(detail, params.name);
				chart.dispatchAction({type: "downplay", seriesIndex: 0});
				Object.entries(ug_province_region)
					.filter(([, region]) => region === params.data.region)
					.forEach(([province]) => chart.dispatchAction({type: "highlight", seriesIndex: 0, name: province}));
			}
		});
		chart.on("mouseout", () => {
			chart.dispatchAction({type: "downplay", seriesIndex: 0});
			update_focus(null);
		});
		chart.on("globalout", () => {
			chart.dispatchAction({type: "downplay", seriesIndex: 0});
			update_focus(null);
		});
		$(window).off("resize.user_growth_region").on("resize.user_growth_region", () => chart.resize());

		bars_element.querySelectorAll(".ug-bar3d-item").forEach((item) => {
			item.addEventListener("mouseenter", () => {
				const detail = details[item.dataset.region];
				update_focus(detail);
				Object.entries(ug_province_region)
					.filter(([, region]) => region === item.dataset.region)
					.forEach(([province]) => chart.dispatchAction({type: "highlight", seriesIndex: 0, name: province}));
			});
			item.addEventListener("mouseleave", () => {
				chart.dispatchAction({type: "downplay", seriesIndex: 0});
				update_focus(null);
			});
		});
	}).catch(() => {
		map_element.innerHTML = `<div class="ug-empty">${__("地图资源加载失败，请刷新后重试")}</div>`;
	});
}

function render_region_focus(element, detail, province = "") {
	const subtitle = province ? `${province} · ${__("所属")} ${detail.region}` : __("全国数据概览");
	const value_label = province ? __("所属大区用户") : __("用户总数");
	element.innerHTML = `<div class="ug-region-focus-head"><div><div class="ug-region-focus-title">${frappe.utils.escape_html(province || detail.region)}</div><div class="ug-region-focus-subtitle">${frappe.utils.escape_html(subtitle)}</div></div><div class="ug-region-focus-value">${Number(detail.total_users || 0).toLocaleString()}<small>${value_label}</small></div></div><div class="ug-region-focus-grid"><div><span>${__("活跃率")}</span><strong>${Number(detail.active_rate || 0).toFixed(1)}%</strong></div><div><span>${__("流失率")}</span><strong>${Number(detail.churn_rate || 0).toFixed(1)}%</strong></div><div><span>${__("本月新增")}</span><strong>${Number(detail.new_users_this_month || 0)}</strong></div></div><div class="ug-region-focus-subtitle" style="margin-top:11px">${__("主要获客渠道")}：<strong style="color:#526173">${frappe.utils.escape_html(detail.top_channel || "—")}</strong></div>`;
}

function render_channels(chart,list,rows) {
	if (!chart||!list) return;
	if (!rows.length){chart.innerHTML=empty_text();list.innerHTML='';return;}
	const colors=['#4f7cff','#38bdf8','#7c8ff5','#8b5cf6','#22c55e','#f59e0b','#f43f5e'],total=rows.reduce((s,r)=>s+Number(r.value||0),0)||1,r=78,c=2*Math.PI*r;
	let offset=0;
	const segments=rows.map((row,i)=>{const value=Number(row.value||0),length=value/total*c,segment=`<circle class="ug-donut-segment" cx="110" cy="110" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="24" stroke-dasharray="${Math.max(0,length-2)} ${c-length+2}" stroke-dashoffset="${-offset}" opacity=".88"><title>${row.label}: ${value} (${(value/total*100).toFixed(1)}%)</title></circle>`;offset+=length;return segment;}).join('');
	chart.innerHTML=`<svg class="ug-donut" viewBox="0 0 220 220"><circle cx="110" cy="110" r="${r}" fill="none" stroke="#edf2f8" stroke-width="24"/>${segments}</svg><div class="ug-donut-center"><strong>${total}</strong><span>${__("\u6e20\u9053\u7528\u6237")}</span></div>`;
	list.innerHTML=rows.map((row,i)=>{const value=Number(row.value||0);return `<div class="ug-channel-row"><span class="ug-channel-dot" style="background:${colors[i%colors.length]}"></span><span class="ug-channel-name">${frappe.utils.escape_html(row.label)}</span><span class="ug-channel-value">${value}<small>${(value/total*100).toFixed(1)}%</small></span></div>`;}).join('');
}

function animate_numbers(root,values) {
	Object.entries(values).forEach(([key,target])=>{const el=root.find(`[data-kpi="${key}"]`)[0];if(!el)return;const end=Number(target||0),start=performance.now(),duration=500;function tick(now){const p=Math.min(1,(now-start)/duration),value=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=value.toLocaleString();if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);});
}
function show_empty(root){root.find('[data-trend-chart],[data-growth-status],[data-region-map],[data-region-focus],[data-channel-chart]').html(empty_text());root.find('[data-region-bars],[data-channel-list]').empty();}
function show_error(wrapper){$(wrapper).find('.user-growth-dashboard').prepend(`<div class="alert alert-danger">${__("\u6570\u636e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002")}</div>`);}
function empty_text(){return `<div class="ug-empty">${__("\u5f53\u524d\u6682\u65e0\u53ef\u5c55\u793a\u7684\u6570\u636e")}</div>`;}
function signed(value){const n=Number(value||0);return `${n>0?'+':''}${n}`;}
