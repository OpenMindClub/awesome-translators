{
	"translatorID": "5a325508-cb60-42c3-8b0f-d4e3c6441058",
	"label": "Weixin",
	"creator": "Fushan Wen",
	"target": "^https?://mp\\.weixin\\.qq\\.com",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcs",
	"lastUpdated": "2021-05-13 02:59:17"
}

/*
	***** BEGIN LICENSE BLOCK *****
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
	const ogType = doc.head.querySelector('meta[property="og:type"]');
	if (ogType && ogType.content === "article") {
		return "blogPost"; //插件图标显示改成博客文章
	}
	return false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) === "blogPost") {	//插件图标显示改成博客文章	
		scrape(doc, url);
	}
}

function scrape(doc, url) {
	const item = new Zotero.Item("blogPost");
	
	const ogMetadataCache = new Map();
	const nodeList = doc.head.querySelectorAll(':scope meta[property^="og:"]');
	for (const node of nodeList) {
		ogMetadataCache.set(node.getAttribute("property"), node.content);
	}
	
	item.title = ogMetadataCache.get("og:title");
	//item.websiteTitle = ogMetadataCache.get("og:site_name"); //改成博客帖子类型后，没有网站标题条目了
	item.rights = ogMetadataCache.get("og:site_name") + "-" + doc.querySelector("#js_name").innerText.trim(); // 将公众号名称放到版权
	item.url = ogMetadataCache.get("og:url");
	item.abstractNote = ogMetadataCache.get("og:description");
	item.creators = getArticleCreator(doc, ogMetadataCache.get("og:article:author"));
	item.date = getArticleDate(doc);
	item.accessDate = new Date().toISOString().slice(0, 10);
	item.blogTitle = doc.querySelector("#js_name").innerText.trim(); 
	note_content = doc.body.querySelector("#js_content").innerHTML.trim();
	note_content = note_content.replace(/\"/g, "'");
	note_content = note_content.replace(/<img .*?src='(.*?)'.*?>/g, "<img src='$1'\/>");
	note_content = `<h1>'摘录'-${item.title}</h1>` + note_content;
	item.notes.push({note:note_content});
	item.attachments.push({url:url, document:doc, title:"Snapshot"});
	item.complete();
}

function getArticleDate(doc) {
	const script_list = ZU.xpath(doc, "//script");
	for (const sc of script_list) {
		if (sc.innerText.includes("今天")) {
			return sc.innerText.match(/=\"(\d+?-\d+?-\d+?)\"/)[1].trim();
		}
	}
	return "";
}

function getArticleCreator(doc, authorName) {
	const profileName = doc.querySelector("#js_name").innerText.trim();
	if (!authorName.length || authorName === profileName) {
		return [{lastName: profileName, creatorType: "author", fieldMode: 1}];
	}
	return [{lastName: authorName, creatorType: "author", fieldMode: 1}, 
			//{lastName: profileName, creatorType: "author", fieldMode: 1} //因为不需要把公众号名字作为第二作者，公众号不一定是作者
		   ];

}
