{
	"translatorID": "3f0e7c7c-d424-4e7c-8b5c-f890ecac9fc3",
	"label": "KnowledgePlanet",
	"creator": "氦客船长<TanGuangZhi@qq.com>",
	"target": "https:\\/\\/(articles|wx)\\.zsxq\\.com\\/.*",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-11-08 11:50:50"
}

/*
	***** BEGIN LICENSE BLOCK *****
	声明:本translator只做内部交流使用,请勿用作商业用途
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
	let flood = ZU.xpath(doc, '//div[@class="talk-content-container"]/div[@class="content"]')
	let question = ZU.xpath(doc, '//div[@class="answer-content-container"]/div[@class="question"]')
	let homework = ZU.xpath(doc, '//div[@class="view-task"]')
	let homeworkList = ZU.xpath(doc, '//div[@class="task-content-container"]/div[@class="content"]')
	// TODO: adjust the logic here
	if (url.includes('articles')) { // 文章-->博客帖子
		return "blogPost";
	}
	else if (url.includes('topic_detail') && flood.length > 0) {  // 灌水-->论坛帖子
		return "forumPost";
	}
	else if (url.includes('topic_detail') && question.length > 0) {  // 提问-->采访
		return "interview";
	}
	else if (url.includes('topic_detail') && homework.length > 0) { // 作业-->报告
		return "report";
	}
	else if (url.includes('topic_detail') && homeworkList.length > 0) { // 作业榜-->报告
		return "report";
	}
	else if (url.includes('index/group')) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, url, checkOnly, itemInfo) {
	var items = {};
	var found = false;
	var rowsList = []
	let row = []
	let multipleInfo = {}

	rowsList = doc.querySelectorAll('div.topic-container');
	for (let i = 1; i < rowsList.length; i++) {
		row = rowsList[i].innerHTML
		
		// title
		let title = row.match(/<div _ngcontent-\w+-c\d+="" class="content".*?>(.*)/g)
		title = RegExp.$1
		if (title.includes("提问")) {
			title = title.match(/<div _ngcontent-\w+-c\d+="" class="question-owner"><.*?>(.*?)<\/span> *提问：/g)
			title = RegExp.$1 + "提问"
		}
		if (title.includes("<span class")) {
			title = title.match(/<span class.*?>(.*?)<\/span>/m)
			title = RegExp.$1
		}
		title = title.substr(0, 30)

		// 日期
		let date = row.match(/<div _ngcontent-\w+-c76="" class="date">(.*?)<!----><!----><\/div>/g)
		date = RegExp.$1

		if (date.includes("前天")) {
			let lastDate = getNowFormatDayNoZero(2)
			date.match(/(\d+:+\d+)/g)
			date = RegExp.$1
			date = lastDate + " " + date
		} else if (date.includes("昨天")) {
			let lastDate = getNowFormatDayNoZero(1)
			date.match(/(\d+:+\d+)/g)
			date = RegExp.$1
			date = lastDate + " " + date
		} else if (date.includes("今天") || date.includes("小时前") || date.includes("分钟前")|| date.includes("刚刚")) {
			let lastDate = getNowFormatDayNoZero(0)
			date.match(/(\d+:+\d+)/g)
			date = RegExp.$1
			date = lastDate + " " + date
		}

		// 作者
		let author = row.match(/<div _ngcontent-\w+-c\d+="" class="role.*?">(.*?)<\/div>/g)
		author = RegExp.$1

		// 内容
		let content = row.match(/<div _ngcontent-\w+-c\d+="" class="content".*?>(\w*[\s\S]*?)查看详情<\/div>/g)
		content = "<h1>#摘录</h1>\n"+RegExp.$1
		content = content.replace(/展开全部/g,"")
		
		// 评论
		let comment = row.match(/<span _ngcontent-\w+-c\d+="" class="comment">.*<\/app-comment-item><!----><\/div><!----><!----><!----><!----><\/div><!----><\/div>/g)
		if(comment){
			comment = "\n<h1>评论</h1>"+comment[0]
		}
		
		if (checkOnly) return true;
		found = true;
		itemInfo[i] = { title: title, date: date, author: author, content: content, comment: comment }
		items[i] = title
	}
	return found ? items : false;
}

function doWeb(doc, url) {
	let homework = ZU.xpath(doc, '//div[@class="view-task"]')
	let homeworkList = ZU.xpath(doc, '//div[@class="task-content-container"]/div[@class="content"]')
	
	var newItem = ""
	if (detectWeb(doc, url) == "multiple") {
		var itemInfo = {};
		Zotero.selectItems(getSearchResults(doc, url, false, itemInfo), function (selectedItems) {
			var ZIDs = [];
			for (let item in selectedItems) {
				ZIDs.push(itemInfo[item]);
			}
			scrapeAllItems(ZIDs)
		});
		return 
	} else if (detectWeb(doc, url) == "blogPost") {  // 文章
		newItem = scrapeArticle(doc, url, "blogPost");
	} else if (detectWeb(doc, url) == "forumPost") {  // 灌水
		newItem = scrapeFlood(doc, url, "forumPost");
	} else if (detectWeb(doc, url) == "interview") {  // 问题
		newItem = scrapeQuestion(doc, url, "interview");
	} else if (detectWeb(doc, url) == "report") {  
		if (url.includes('topic_detail') && homeworkList.length > 0) {
			newItem = scrapeHomeworkList(doc, url, "report"); // 作业榜
		} else {
			newItem = scrapeHomework(doc, url, "report"); // 作业
		}
	} else { // 没匹配到的直接结束
		return
	}
}

function scrapeArticle(doc, url, newItem) {
	newItem = new Zotero.Item(newItem)
	// 标题
	let title = ZU.xpathText(doc, '//h1[@class="title"]')
	newItem.title = title

	// 作者
	let author = ZU.xpathText(doc, '//span[@class="nick-name"]')
	newItem.creators.push(
		{
			firstName: "",
			lastName: author,
			creatorType: "author",
			fieldMode: true
		}
	);

	// 博客标题
	let blogTitle = ZU.xpathText(doc, '//span[@class="group-name"]')
	newItem.blogTitle = blogTitle

	// content
	let contentList = ZU.xpath(doc, '//div[@class="content"]')
	let content = contentList[0].innerHTML
	newItem.notes.push({ note: content })
	
	scrapeAllUsed(doc, url, newItem)
}

function scrapeFlood(doc, url, newItem) {
	newItem = new Zotero.Item(newItem)
	let title = ""

	// content
	let contentList = ZU.xpath(doc, '//div[@class="talk-content-container"]/div[@class="content"]')
	let content = ""
	if (contentList.length > 0) {
		content = contentList[0].innerHTML
		content = "<h1>#摘录</h1>" + content
		content = content.replace(/\n/g, "<br>")
		// 标题取内容前30个字符
		title = contentList[0].innerText.substr(0, 30)
	}

	// comment
	commentList = ZU.xpath(doc, '//div[@class="comment-container"]')
	let comment = ""
	if (commentList.length > 0) {
		for (let i in commentList) {
			comment = comment + "\n\n" + commentList[i].innerHTML
		}
		comment = "\n<h1>评论</h1>" + comment
	}

	// note
	newItem.notes.push({ note: content + "\n" + comment })

	newItem.title = title
	scrapeAllUsed(doc, url, newItem)
}

function scrapeQuestion(doc, url, newItem) {
	newItem = new Zotero.Item(newItem)
	// question-->title
	let question = ZU.xpathText(doc, '//span[@class="question-contain"]')
	newItem.title = question.substr(0, 30)

	// 提问者
	let questioner = ZU.xpathText(doc, '//div[@class="question-owner"]/span')
	newItem.rights = questioner

	// answer-->note
	let answerList = ZU.xpath(doc, '//div[@class="answer"]')
	let answer = answerList[0].outerHTML
	answer = "<h1>#摘录</h1>" + answer
	answer = answer.replace(/\n/g, "<br>")
	content = answer

	// comment-->note

	let commentList = ZU.xpath(doc, '//div[@class="comment-item-container"]')
	let comment = ""

	for (let i in commentList) {
		comment = comment + "\n\n" + commentList[i].innerHTML
	}
	comment = "\n<h1>评论</h1>" + comment

	// note
	newItem.notes.push({
		note: content + "\n" + comment
	})
	scrapeAllUsed(doc, url, newItem)
}

function scrapeHomeworkList(doc, url, newItem) {
	newItem = new Zotero.Item(newItem)

	let author = ZU.xpathText(doc, '//div[@class="role member" or  contains(@class, "role owner") or  contains(@class, "role guest") or  contains(@class, "role partner")]')
	let title = ""

	// content-->note
	let contentList = ZU.xpath(doc, '//div[@class="task-content-container" ]/div[@class="content"]')
	if (contentList.length > 0) {
		let content = contentList[0].innerHTML

		// 取content的首行作为title
		title = content.match(/.*/)[0]
		title = title.replace(/<span class="hashtag".*?>(.*?)<\/span>/g,"$1")
		
		newItem.title = title.substr(0, 30)

		content = "<h1>#摘录</h1>" + content
		content = content.replace(/\n/g, "<br>")
		
		 // comment-->note
		let commentList = ZU.xpath(doc, '//div[@class="comment-container"]')
		let comment = ""
		
		if(commentList.length>0){
			for(i in commentList){
				comment = commentList[i].innerText+"\n"+comment
			}
			comment = "\n<h1>评论</h1>" + comment
			comment = comment.replace(/\n/g, "<br>")
		}
		// note
		newItem.notes.push({ note: content + comment})
	}
	scrapeAllUsed(doc, url, newItem)
}

function scrapeHomework(doc, url, newItem) {
	newItem = new Zotero.Item("report")
	let author = ZU.xpathText(doc, '//div[@class="role member" or  contains(@class, "role owner") or  contains(@class, "role guest") or  contains(@class, "role partner")]')
	newItem.title = author + "的作业"

	// content-->note
	let contentList = ZU.xpath(doc, '//div[@class="solution-content-container" ]/div[@class="content"]')
	let content = contentList[0].innerHTML
	content = "<h1>#摘录</h1>" + content
	content = content.replace(/\n/g, "<br>")

	// comment-->note
	let commentList = ZU.xpath(doc, '//div[@class="comment-item-container"]')
	let comment = ""
	// note
	newItem.notes.push({ note: content + "\n" + comment })
	scrapeAllUsed(doc, url, newItem)
}

function scrapeAllUsed(doc, url, newItem) {
	 // 作者
	let author = ZU.xpathText(doc, '//div[@class="role member" or  contains(@class, "role owner") or  contains(@class, "role guest") or  contains(@class, "role partner")]')
	newItem.creators.push(
		{
			firstName: "",
			lastName: author,
			creatorType: "author",
			fieldMode: true
		}
	);

	// 提交时间
	let pubTime = ZU.xpathText(doc, '//div[@class="date"]')
	if (!pubTime) {
		pubTime = ZU.xpathText(doc, '//span[@class="date"]')
	}
	pubTime = pubTime.replace(/\//g, "-")
	pubTime = pubTime.replace(/年/g, "-")
	pubTime = pubTime.replace(/月/g, "-")
	pubTime = pubTime.replace(/日/g, "")
	pubTime = pubTime.replace(/-0/g, "-")
	if (pubTime.includes("前天")) {
			let lastDate = getNowFormatDayNoZero(2)
			pubTime.match(/(\d+:+\d+)/g)
			pubTime = RegExp.$1
			pubTime = lastDate + " " + pubTime
		} else if (pubTime.includes("昨天")) {
			let lastDate = getNowFormatDayNoZero(1)
			pubTime.match(/(\d+:+\d+)/g)
			pubTime = RegExp.$1
			pubTime = lastDate + " " + pubTime
		} else if (pubTime.includes("今天") || pubTime.includes("小时前") || pubTime.includes("分钟前")|| pubTime.includes("刚刚")) {
			let lastDate = getNowFormatDayNoZero(0)
			pubTime.match(/(\d+:+\d+)/g)
			pubTime = RegExp.$1
			pubTime = lastDate + " " + pubTime
		}
	newItem.date = pubTime

	// url
	newItem.url = url

	// 几人赞过
	let like = ZU.xpathText(doc, '//span[@class="like-text"]')
	if (like) {
		like = like.replace(/等/g, "")
		let nowTime = getNowFormatTime()
		nowTime = " 📅" + nowTime
		newItem.extra = like + nowTime
	}

	// 星球名称
	let plantName = ZU.xpathText(doc, '//span[@class="group-name"]')
	if (!plantName) {
		plantName = ZU.xpathText(doc, '//span[@class="group-name"]/span')
	} else
	plantName = plantName.replace(/返回 /g, "")
	newItem.rights = plantName

	// tags
	let tagsList = ZU.xpath(doc, '//div[@class="tag-container"]')
	if (tagsList.length > 0) {
		tagsList = tagsList[0].innerText
		tagsList = tagsList.split("\n")
		for (let i in tagsList) {
			newItem.tags.push(tagsList[i]);
		}
	}

	newItem.complete()
}

function scrapeAllItems(items) {
	if (!items.length) return false;
	var { title, date, author, content, comment } = items.shift()
	var newItem = new Zotero.Item("blogPost")
	newItem.title = title.substr(0, 30)
	newItem.date = date
	newItem.creators.push(
		{
			firstName: "",
			lastName: author,
			creatorType: "author",
			fieldMode: true
		}
	);
	newItem.notes.push({ note: content + comment })
	newItem.complete()
	if (items.length > 0) {
		scrapeAllItems(items);
	}
}

function scrape(doc, url) {
	var newItem = new Zotero.Item("blogPost");
	// 标题
	let title = ZU.xpathText(doc, '//h1[@class="title"]')
	newItem.title = title

	// 提交时间
	let pubTime = ZU.xpathText(doc, '//span[@class="date"]')
	pubTime = pubTime.replace(/年/g, "-")
	pubTime = pubTime.replace(/月/g, "-")
	pubTime = pubTime.replace(/日/g, "")
	let matches = pubTime.match(/-0(\d)/g)
	newItem.date = pubTime

	// 作者
	let author = ZU.xpathText(doc, '//span[@class="nick-name"]')
	newItem.creators.push(
		{
			firstName: "",
			lastName: author,
			creatorType: "author",
			fieldMode: true
		}
	);

	// 博客标题
	let blogTitle = ZU.xpathText(doc, '//span[@class="group-name"]')
	newItem.blogTitle = blogTitle

	// URL
	newItem.url = url

	// content
	let contentList = ZU.xpath(doc, '//div[@class="content"]')
	let content = contentList[0].innerHTML
	newItem.notes.push({ note: content })

	// MarkDown转化note

	newItem.complete();
}

//获取前天或昨天日期，格式YYYY-MM-DD(非补零)
function getNowFormatDayNoZero(lastDayNum) {
	var char = "-";
	var nowDate = new Date();
	var day = nowDate.getDate() - lastDayNum;
	var month = nowDate.getMonth() + 1;//注意月份需要+1
	var year = nowDate.getFullYear();
	//补全0，并拼接
	return year + char + month + char + day;
}

//获取当前日期，格式YYYY-MM-DD
function getNowFormatDay(nowDate) {
	var char = "-";
	if (nowDate == null) {
		nowDate = new Date();
	}
	var day = nowDate.getDate();
	var month = nowDate.getMonth() + 1;//注意月份需要+1
	var year = nowDate.getFullYear();
	//补全0，并拼接
	return year + char + completeDate(month) + char + completeDate(day);
}

//获取当前时间，格式YYYY-MM-DD HH:mm:ss
function getNowFormatTime() {
	var nowDate = new Date();
	var colon = ":";
	var h = nowDate.getHours();
	var m = nowDate.getMinutes();
	var s = nowDate.getSeconds();
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
		"url": "https://wx.zsxq.com/dweb2/index/group/15288424551852",
		"items": "multiple"
	}
]
/** END TEST CASES **/
