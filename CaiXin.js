{
	"translatorID": "91a9f8d0-c4f3-43bf-9595-7ef3d6f0fcca",
	"label": "CaiXin",
	"creator": "氦客船长<TanGuangZhi@qq.com>",
	"target": "https://\\w+.caixin.com/.*.html",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-05-30 15:49:52"
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
	
	Github: https://github.com/TanGuangZhi/MyTranslator
*/


function detectWeb(doc, url) {
	// TODO: adjust the logic here
	// if (url.includes('/article/')) {
	// 	return "newspaperArticle";
	// }
	return "newspaperArticle";
	// else if (getSearchResults(doc, true)) {
	// 	return "multiple";
	// }
	// return false;
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
	let author = ZU.xpathText(doc, '//span[@id="author_baidu"]')
	author = author.replace(/作者：/g,"").split(" ")
	// 这里发布时间从Url里取效果不错
	let pubTime = ""
	url.match(/\/(\d+-\d+-\d+)\//g)
	pubTime = RegExp.$1
	
	let newItem = new Zotero.Item("newspaperArticle");
	for(i in author){
		newItem.creators.push(
					{
					lastName:author[i],
					creatorType:"author",
					fieldMode:false
					}
				);
	}
	newItem.title = title
	newItem.abstractNote = abs
	newItem.date = pubTime
	newItem.url = url
	newItem.rights = "财新"
	newItem.attachments.push({url:url,document:doc,title:"webpage"})
	newItem.complete()
	
}








































