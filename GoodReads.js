{
	"translatorID": "4355f8a9-3d1a-4cd6-ba02-1a458c3d81e1",
	"label": "Goodreads",
	"creator": "氦客船长<TanGuangZhi@foxmail.com>",
	"target": "https://www.goodreads.com/author|book/.*",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-06-16 10:17:40"
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
	if (url.includes('/book/')) {
		return "book";
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
	var rows = doc.querySelectorAll('a[class="bookTitle"]');
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

function scrape(doc, url){
	var newItem = new Zotero.Item("book");
	
	// title
	let GrTitle = ZU.xpathText(doc, '//h1[@id="bookTitle"]')
	newItem.title = GrTitle
	
	// author
	let authorList = ZU.xpathText(doc, '//span[@itemprop="name"]')
	authorList = authorList.split(",")
	let author = ""
	for(i=0;i<authorList.length;i++){
		author = authorList[i]
		// 拆分lastname与firstname
		author = ZU.cleanAuthor(author, 'author') 
		newItem.creators.push({firstName:author.firstName,
							lastName:author.lastName, 
							creatorType:"author",
							fieldMode:true});
	}
	
	// 摘要
	let GrAbstractList = ZU.xpath(doc, '//div[@id="description"]/span')
	if(GrAbstractList.length>0){
		let GrAbstract = GrAbstractList[0].innerHTML
		if(GrAbstractList.length>1){
			GrAbstract = GrAbstractList[1].innerHTML
		}
		GrAbstract = GrAbstract.replace(/<br>/g,"\n")
		GrAbstract = GrAbstract.replace(/<\/?\w+>/g,"")
		newItem.abstractNote = GrAbstract
	}

	
	// 评分
	let nowTime = getNowFormatTime()
	let GrScore = ZU.xpathText(doc, '//span[@itemprop="ratingValue"]')
	GrScore= GrScore.trim()
	if(GrScore==="  "||GrScore===""){
		GrScore = "?"
	}
	GrScore = "G"+GrScore+" 📆"+nowTime
	newItem.extra = GrScore
	
	// ratings
	let GrRatingsList = ZU.xpath(doc, '//meta[@itemprop="ratingCount"]')
	let GrRatings = GrRatingsList[0].content
	GrRatings= GrRatings.trim()+" ratings"
	if(GrRatings==="  "||GrRatings===""){
		GrRatings = "?"
	}
	newItem.place = GrRatings
	
	// pages
	let pages = ZU.xpathText(doc, '//span[@itemprop="numberOfPages"]')
	newItem.numPages = pages
	
	// Published Time → date字段
	let publishedTimeList = ZU.xpath(doc, '//div[@class="uitext darkGreyText"]/div[@class="row" and contains(text(),"Published")]')
	let publishedTime = ""
	let publisher = "" // 出版社
	if(publishedTimeList){
		publishedTime = publishedTimeList[0].innerText
		if(publishedTime.includes("(first published")){
			publishedTime.match(/(.*) \((.*)\)/g)
			publishedTime = RegExp.$2
			publisher = RegExp.$1
			publishedTime = publishedTime.replace(/first published /g,"")
			publisher.match(/.* by (.*)/g)
			publisher = RegExp.$1
		} else{
			publishedTime.match(/Published(.+)by(.+)/g)
			publishedTime = RegExp.$1
			publisher = RegExp.$2
		}
	
		// 英文格式的日期转yyyy-MM-dd
		if(publishedTime){
			publishedTime = stringDateToNum(publishedTime)
		}
		newItem.date = publishedTime
		newItem.publisher = publisher
	}
	
	// ISBN
	let GrISBN = ZU.xpathText(doc, '//div[@class="clearFloats"]/div[@class="infoBoxRowItem"]/span')
	newItem.ISBN = GrISBN
	
	// Kindle价格 → rights字段 这里需要是美区IP才能显示Kindle价格
	let price = ZU.xpathText(doc, '//ul[@class="buyButtonBar left"]/li/a[contains(text(),"Kindle Store")]')
	if(price){
		price = "$"+price.match(/\d+\.?\d+/g)[0]
		newItem.rights = price
	}
	// URL
	newItem.url = url
	
	newItem.complete();
}

//  March 3rd 2019 中March转2019-03-03
function stringDateToNum(stringDate){
	let string2Month = {
			January:"01",
			February:"02",
			March:"03",
			April:"04",
			May:"05",
			June:"06",
			July:"07",
			August:"08",
			September:"09",
			October:"10",
			November:"11",
			December:"12"
	}	
	let stringDateList = stringDate.match(/\w+/g)
	let year = ""
	let month = ""
	let day = ""
	let temp = ""
	// 应对某些书籍没有月日的情况
	if(stringDateList.length>2){
		year = stringDateList[2]
		month = stringDateList[0]
		day = stringDateList[1]
		month = string2Month[month]
		day = day.match(/\d+/g)[0]
		if(day.length<2){ // day不足2位补零
			day = "0"+day
		}
		temp = year+"-"+month+"-"+day
	} else if (stringDateList.length>1){
		year = stringDateList[1]
		month = stringDateList[0]
		month = string2Month[month]
		temp = year+"-"+month
	} else {
		year = stringDateList[0]
		temp = year
	}
	return temp
}

//获取当前日期，格式YYYY-MM-DD
function getNowFormatDay(nowDate) {
	var char = "-";
	if(nowDate == null){
		nowDate = new Date();
	}
	var day = nowDate.getDate();
	var month = nowDate.getMonth() + 1;//注意月份需要+1
	var year = nowDate.getFullYear();
	//补全0，并拼接
	return year + char + completeDate(month) + char +completeDate(day);
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
		return value < 10 ? "0"+value:value;
	}



































