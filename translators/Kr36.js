{
	"translatorID": "3c6fd211-4008-4107-8b65-796f661751d5",
	"label": "Kr36",
	"creator": "氦客船长<TanGuangZhi@qq.com>",
	"target": "https://www.36kr.com/p/.*",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-05-30 13:41:28"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2020 YOUR_NAME <- TODO
	
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	// TODO: adjust the logic here
	if (url.includes('/p/')) {
		return "blogPost";
	}
	// else if (getSearchResults(doc, true)) {
	// 	return "multiple";
	// }
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('h2>a.title[href*="/article/"]');
	for (let row of rows) {
		// TODO: check and maybe adjust
		let href = row.href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), scrape);
		});
	}
	else {
		scrape(doc, url);
	}
}
function scrape(doc, url) {
	let title = doc.head.querySelector('[property="og:title"]').content
	let abs = doc.head.querySelector('[property="og:description"]').content
	let keywords = doc.head.querySelector('[name="keywords"]').content
	let author = ZU.xpathText(doc, '//a[@class="title-icon-item item-a"]')
	let pubTime = ZU.xpathText(doc, '//span[@class="title-icon-item item-time"]')
	pubTime = dateFormat(pubTime)
	let like = ZU.xpathText(doc, '//div[@class="thumbNum normalColor"]') // 点赞数
	
	let newItem = new Zotero.Item("blogPost");
	newItem.creators.push(
					{firstName:"",
					lastName:author,
					creatorType:"author",
					fieldMode:true
					}
				);
	newItem.title = title
	newItem.abstractNote = abs
	newItem.date = pubTime
	newItem.url = url
	newItem.rights = "36Kr"
	newItem.extra = like+" 💕 "+new Date().Format("yyyy-MM-dd HH:mm:ss")
	newItem.attachments.push({url:url,document:doc,title:title})
	
	newItem.complete()
}


function dateFormat(date) {
		if (date.includes("天前")) {
			let dateNum = 0
			date.match(/(\d)天前/g)
			dateNum = RegExp.$1
			date = daysJian(dateNum)
		} else if (date.includes("今天") || date.includes("小时前") || date.includes("分钟前")|| date.includes("刚刚")) {
			date = daysJian(0)
		}
	return date
}


Date.prototype.Format = function (fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"H+": this.getHours(), //小时 
		"m+": this.getMinutes(), //分 
		"s+": this.getSeconds(), //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds() //毫秒 
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
	if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}
 


function daysJian(num){
  var date = new Date();//获取当前时间
  date.setDate(date.getDate() - num);//设置天数 -1 天
  var time = date.Format("yyyy-MM-dd");
  return time 
}






































