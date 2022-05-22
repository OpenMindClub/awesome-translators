{
	"translatorID": "4bbf6000-8a8d-4390-8e8a-d1624e5c7404",
	"label": "CnkiScholar",
	"creator": "氦客船长<TanGuangZhi@qq.com>",
	"target": "https://scholar.cnki.net/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-06-26 08:12:32"
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
	if (url.includes('/Detail/')) {
		return "journalArticle";
	}
	else if (getSearchResults(doc, true)) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('div.search-content-left > div.argicle-title:first-child>a');
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
	var item = new Zotero.Item("journalArticle");
	try {
		let title = doc.querySelector('div#doc-title').innerText
		let abs = doc.querySelector("div#doc-summary-content-text").innerText
		// var d1 = doc.querySelector('div[data-id="p001.t001.e002.TIKWpT92"]');
		// d1.click();
		// let absTrans = doc.querySelector("div#doc-summary-content-text").innerText
		let doi = doc.querySelector("div[class='detail_doc-doi__VX6o2 detail_doc-item__2l-2B'] >a").innerText
		let pubDate = doc.querySelector('span.detail_issue-year-page__2MO-m').innerText
	
		let authors = doc.querySelectorAll("div[class='detail_text__wHyrA'] >a")
		for (i in authors) {
			let author = authors[i].innerText
			if (author) {
				author = author.replace(/;/g, "")
				author = ZU.cleanAuthor(author, "author")
				item.creators.push(
					{
						firstName: author.firstName,
						lastName: author.lastName,
						creatorType: "author",
						fieldMode: true
					}
				);
			}
		}
		item.title = title
		item.abstractNote = abs
		item.date = pubDate
		item.DOI = doi 
		item.complete();
	} catch (x) {
		Z.debug('=============x=============')
		Z.debug(x)
	}
}
