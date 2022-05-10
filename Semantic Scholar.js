{
	"translatorID": "276cb34c-6861-4de7-a11d-c2e46fb8af28",
	"label": "Semantic Scholar",
	"creator": "Guy Aglionby,氦客船长<TanGuangZhi@qq.com>",
	"target": "^https?:\\/\\/(www\\.semanticscholar\\.org\\/(paper|author)\\/.+|pdfs\\.semanticscholar\\.org\\/)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-06-22 02:59:11"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2017 Guy Aglionby
	
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

// See also https://github.com/zotero/translators/blob/master/BibTeX.js
let bibtex2zoteroTypeMap = {
	inproceedings: "conferencePaper",
	conference: "conferencePaper",
	article: "journalArticle"
};

function detectWeb(doc, url) {
	let citation = ZU.xpathText(doc, '//pre[@class="bibtex-citation"]');
	if (citation) {
		let citation = ZU.xpathText(doc, '//pre[@class="bibtex-citation"]');
		let type = citation.split('{')[0].replace('@', '');
		return bibtex2zoteroTypeMap[type];
	} else if (url.includes("/author/")) {
		return "multiple"
	}

}

function doWeb(doc, url) {
	if (url.includes('pdfs.semanticscholar.org')) {
		let urlComponents = url.split('/');
		let paperId = urlComponents[3] + urlComponents[4].replace('.pdf', '');
		const API_URL = 'https://api.semanticscholar.org/';
		ZU.processDocuments(API_URL + paperId, parseDocument);
	} else if (detectWeb(doc, url) == "multiple") {
		let itemInfo = {};
		Zotero.selectItems(getSearchResults(doc, false, itemInfo), function (selectedItems) {
			var multScrapId = [];
			for (let link in selectedItems) {
				multScrap(link)
			}
		});

	}
	else {
		parseDocument(doc, url);
	}
}


function getSearchResults(doc, checkOnly, itemInfo) {

	let items = {};
	let found = false;
	let allLinks = doc.querySelectorAll('a[data-selenium-selector="title-link"]');
	let allTitle = doc.querySelectorAll('div.cl-paper-title');
	let showTitle = []

	for (let i = 0; i < allLinks.length; i++) {
		let link = "https://www.semanticscholar.org" + allLinks[i].getAttribute('href');
		showTitle = allTitle[i].innerText
		found = true;
		itemInfo[link] = link;
		items[link] = showTitle;
	}
	return found ? items : false;
}

function multScrap(multScrapId) {
	ZU.doGet(multScrapId, function (text) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(text, "text/html");
		parseDocument(doc, multScrapId)
	})
}

function parseDocument(doc, url) {

	let citation = ZU.xpathText(doc, '//pre[@class="bibtex-citation"]');
	let type = citation.split('{')[0].replace('@', '');
	const itemType = bibtex2zoteroTypeMap[type];

	let item = new Zotero.Item(itemType);

	// load structured schema data
	const schemaTag = doc.querySelector("script.schema-data");
	const schemaObject = JSON.parse(schemaTag.innerHTML);
	const article = schemaObject["@graph"][1][0];

	item.title = article.name;
	item.abstractNote = article.description;

	if (article.author) {
		article.author.forEach((author) => {
			item.creators.push(ZU.cleanAuthor(author.name, 'author'));
		});
	}
	item.publicationTitle = article.publication;
	item.date = article.datePublished;

	// viewOnSageUrl 
	// let viewOnSageUrlList = ZU.xpath(doc, '//div[@class="flex-item primary-paper-link-button"]')

	// let viewOnSageUrl = viewOnSageUrlList[0].innerHTML
	// viewOnSageUrl.match(/href="(http.+\d)">/g)
	// viewOnSageUrl = RegExp.$1
	// item.url = viewOnSageUrl

	// citation_pdf_url

	if (doc.head.querySelector('[name="citation_pdf_url"]')) {
		let citationPdfUrl = doc.head.querySelector('[name="citation_pdf_url"]').content
		item.url = citationPdfUrl
	} else {
		item.url = url
	}


	// 现在的时间
	let nowDate = getNowFormatTime()
	try {
		let tags = ZU.xpathText(doc, '//li[@class="paper-meta-item"]/following-sibling::li').split(",");
		let publication = ""
		if (tags) {
			tags.shift() // 去除published Data
			item.tags = tags
			publication = tags[tags.length - 1]
			item.publicationTitle = publication
		}
	} catch (error) {
		Z.debug('=============error=============')
		Z.debug(error)
	}

	// extra: 引用量
	let references = ZU.xpathText(doc, '//span[@class="scorecard-stat__headline__dark"]');
	if (references) {
		// 替换','数字分隔符,便于排序
		references = references.replace(/,/g,"")
		references = references.match(/\d+/g)
		item.extra = "S" + references + " 📅" + nowDate
	}

	item.attachments.push({
		url: url,
		title: "Semantic Scholar Link",
		mimeType: "text/html",
		snapshot: false
	});

	// if semantic scholar has a pdf as it's primary paper link it will appear in the about field
	let paperLink = ""
	if (paperLink) {
		paperLink = article.about.url;
	}

	if (paperLink.includes("pdfs.semanticscholar.org") || paperLink.includes("arxiv.org")) {
		item.attachments.push({
			url: paperLink,
			title: "Full Text PDF",
			mimeType: 'application/pdf'
		});
	}

	// use the public api to retrieve more structured data
	const paperIdRegex = /\/(.{40})(\?|$)/;
	const paperId = paperIdRegex.exec(url)[1];
	const apiUrl = `https://api.semanticscholar.org/v1/paper/${paperId}?client=zotero_connect`;
	ZU.doGet(apiUrl, (data) => {
		let json = JSON.parse(data);
		item.DOI = json.doi;
		item.complete();
	});
}

//获取当前日期，格式YYYY-MM-DD
function getNowFormatDay(nowDate) {
	let char = "-";
	if (nowDate == null) {
		nowDate = new Date();
	}
	let day = nowDate.getDate();
	let month = nowDate.getMonth() + 1;//注意月份需要+1
	let year = nowDate.getFullYear();
	//补全0，并拼接
	return year + char + completeDate(month) + char + completeDate(day);
}

//获取当前时间，格式YYYY-MM-DD HH:mm:ss
function getNowFormatTime() {
	let nowDate = new Date();
	let colon = ":";
	let h = nowDate.getHours();
	let m = nowDate.getMinutes();
	let s = nowDate.getSeconds();
	//补全0，并拼接
	return getNowFormatDay(nowDate) + " " + completeDate(h) + colon + completeDate(m) + colon + completeDate(s);
}

//补全0
function completeDate(value) {
	return value < 10 ? "0" + value : value;
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.semanticscholar.org/paper/TectoMT%3A-Modular-NLP-Framework-Popel-Zabokrtsk%C3%BD/e1ea10a288632a4003a4221759bc7f7a2df36208",
		"items": [
			{
				"itemType": "conferencePaper",
				"title": "TectoMT: Modular NLP Framework",
				"creators": [
					{
						"firstName": "Martin",
						"lastName": "Popel",
						"creatorType": "author"
					},
					{
						"firstName": "Zdenek",
						"lastName": "Zabokrtský",
						"creatorType": "author"
					}
				],
				"date": "2010",
				"abstractNote": "In the present paper we describe TectoMT, a multi-purpose open-source NLP framework. It allows for fast and efficient development of NLP applications by exploiting a wide range of software modules already integrated in TectoMT, such as tools for sentence segmentation, tokenization, morphological analysis, POS tagging, shallow and deep syntax parsing, named entity recognition, anaphora resolution, tree-to-tree translation, natural language generation, word-level alignment of parallel corpora, and other tasks. One of the most complex applications of TectoMT is the English-Czech machine translation system with transfer on deep syntactic (tectogrammatical) layer. Several modules are available also for other languages (German, Russian, Arabic).Where possible, modules are implemented in a language-independent way, so they can be reused in many applications.",
				"libraryCatalog": "Semantic Scholar",
				"proceedingsTitle": "IceTAL",
				"shortTitle": "TectoMT",
				"attachments": [
					{
						"title": "Semantic Scholar Link",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"notes": [],
				"seeAlso": [],
				"tags": [],
				"DOI": "10.1007/978-3-642-14770-8_33"
			}
		]
	}
]
/** END TEST CASES **/
