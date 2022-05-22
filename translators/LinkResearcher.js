{
	"translatorID": "3c89b542-7633-401a-be56-a9c8ad886540",
	"label": "LinkResearcher",
	"creator": "氦客船长<TanGuangZhi@foxmail.com>",
	"target": "https://www.linkresearcher.com/theses|searchall",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-10-15 08:40:19"
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
	if (url.includes('/theses/')) {
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
	var rows = doc.querySelectorAll('div[style="margin-top: 30px;"] a');
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
	var translator = Zotero.loadTranslator('web');
	// Embedded Metadata
	translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
	// translator.setDocument(doc);

	translator.setHandler('itemDone', function (obj, item) {
		let pubDate = doc.body.querySelector('span.text-minor').innerHTML
		let note = doc.body.querySelector('span.user-html').innerHTML
		let author = doc.body.querySelector('div[style="font-size: 18px; line-height: 25px; margin-left: 4px;"]')
		if (author) {
			author = author.textContent
		} else {
			author = "领研网"
		}

		// 清空meta中获取到的所有tag标签
		item.tags = []
		// 获取文章内部标签
		let tags = doc.querySelectorAll('a[class="text-primary hover-border-primary"]')
		for (let tag of tags) {
			tag = tag.text
			item.tags.push(tag)
		}

		item.date = pubDate
		item.notes.push(note)
		item.creators.shift()
		item.creators.push(
			{
				firstName: "",
				lastName: author,
				creatorType: "author",
				fieldMode: true
			}
		);
		item.attachments = []
		item.complete();
	});

	translator.getTranslatorObject(function (trans) {
		trans.itemType = "journalArticle";
		// TODO map additional meta tags here, or delete completely
		trans.addCustomFields({
			'twitter:description': 'abstractNote'
		});
		trans.doWeb(doc, url);
	});
}

function dateFormat(date) {
	if (date.includes("天前")) {
		let dateNum = 0
		date.match(/(\d)天前/g)
		dateNum = RegExp.$1
		date = daysJian(dateNum)
	} else if (date.includes("今天") || date.includes("小时前") || date.includes("分钟前") || date.includes("刚刚")) {
		date = daysJian(0)
	}
	return date
}


Date.prototype.Format = function (fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"h+": this.getHours(), //小时 
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



function daysJian(num) {
	var date = new Date();//获取当前时间
	date.setDate(date.getDate() - num);//设置天数 -1 天
	var time = date.Format("yyyy-MM-dd");
	return time
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.linkresearcher.com/theses/e0d378e7-c9cc-489b-95db-12d9b319704c",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "要想间歇性禁食效果好，断掉夜宵少不了 | 论文频道 | 领研网",
				"creators": [
					{
						"firstName": "",
						"lastName": "中国生物技术网",
						"creatorType": "author",
						"fieldMode": true
					}
				],
				"date": "2021/10/11",
				"abstractNote": "众所周知，每个器官，每个组织，甚至每个细胞都有自己的生物钟。因此，让它们每天能得到休息以修复、重置和恢复节律是至关重要的。当它们都恢复活力时，就可以高效完成所有任务。这就好比一支管弦乐队，当所有乐器都协调一致且配合得当时，你听到的就是优美的旋律；否则，就是难以入耳的噪音。通过建立一个持续的每日进食和禁食周期，机体会根据自然的昼夜节律重新调整热量摄入曲线。间歇性禁食策略应运而生，并已被证明可以减肥并延长许多物种的寿命以及提高认知能力，包括在啮齿类动物、灵长类动物以及人类衰老过程中引起广泛的健康改善。目前应用最广泛的间歇性禁食策略是限时进食（TRF），即将进食时间窗缩窄至8小时。然而，对于那些想要通过间歇性禁食来减缓衰老的人来说，遵循这种饮食干预策略有些困难。在现代社会，人们已习惯了一日三餐，间歇性禁食的计划往往会受到饥饿感的挑战。而有些人通过强大的意志力战胜饥饿感后，却没收获到太多的健康改善。那你要问问自己，是不是禁食时间选错了。北京时间9月30日，发表在《Nature》上的一项最新研究中，来自美国哥伦比亚大学领导的研究团队揭示了间歇性禁食如何在细胞内减慢衰老过程，并指出了延长寿命并改善健康的关键禁食时段。一般来说，限时进食（TRF）将食物摄入量限制在一天中的特定时间，但不限制营养或总热量的摄入。因此，时间的作用是一条关于禁食与健康长寿之间关系的重要线索，但是潜在的分子机制仍是个谜。在这项研究中，研究人员使用果蝇进行了研究。尽管这种小飞虫看起来与人类截然不同，但它们的生物钟却与人类相似：白天活跃，晚上睡觉，同时也共享约70%的人类疾病相关基因。而且，果蝇还是一个非常好的衰老模型，因为它与人类的衰老方式也相似，而且由于其寿命仅有两个月，因此，衰老实验在技术上更易于操作。为了测试延禁食的效果，研究人员给果蝇分为四组，实验持续40天。第一组：24小时自由进食，不受限制；第二组：标准的TRF，开灯后（模拟白天）12小时进食，关灯后12小时禁食；第三组：隔日进食，即24小时禁食后第二天自由进食，不受限制；第四组为研究人员开发的一种新版限时进食策略（iTRF）方案组，这组果蝇在第一天只有在中午4小时时间进食，然后禁食20小时。到了第二天全天可以自由进食。经过反复的实验结果显示，只有第四组，即iTRF方案显著延长了果蝇寿命（雌性延长了18%，雄性延长了13%）并延迟肌肉和肠道中老化标志物的出现。这意味着，iTRF方案还改善了果蝇的“健康期”。研究人员发现，iTRF增强了昼夜节律调节的转录，并且iTRF介导的寿命延长需要昼夜节律调节和自噬，这是一条保守的长寿途径。当敲除果蝇核心时钟基因或抑制自噬介导因子表达，以及改为白天禁食夜间进食，或在白天诱导自噬，均无法延长寿命。因此，禁食的时机非常关键，也就是说，只有从晚上开始饿肚子，一直饿到第二天午餐时分的果蝇寿命才得到延长；而那些全天禁食，只在晚上吃东西的果蝇寿命没有改变。那些遵循间歇性禁食策略同时还在吃夜宵的人，是不是得到了什么启示？研究人员还发现，增强夜间自噬，能在随意进食的果蝇中起到与iTRF方案一样的有益作用。他们表示，如果能从药理学上加强夜间自噬，那么不用挨饿就可以获得同样的健康益处。总之，这项研究表明要想让间歇性禁食策略带来最大化的收益，昼夜节律调节的自噬是关键。由于是人类衰老过程中高度保守的过程，因此，该研究同时强调了刺激昼夜节律调节的自噬行为或药物干预手段可能会为人类提供类似延缓衰老甚至延长寿命的健康益处。",
				"libraryCatalog": "www.linkresearcher.com",
				"url": "https://www.linkresearcher.com/theses/e0d378e7-c9cc-489b-95db-12d9b319704c",
				"attachments": [],
				"tags": [
					{
						"tag": "昼夜节律"
					},
					{
						"tag": "自噬"
					},
					{
						"tag": "衰老"
					},
					{
						"tag": "间歇性禁食"
					},
					{
						"tag": "限制进食"
					}
				],
				"notes": [
					"<div class=\"rich_media_content\" style=\"\">\n<section style=\"text-align:center;\"><img src=\"https://cdn.linkresearcher.com/nf63qi2e-kydf-iu1l-zxtv-gkta4ed1\" style=\"color:rgb(0, 0, 0);\"><br></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">众所周知，每个器官，每个组织，甚至每个细胞都有自己的<strong>生物钟</strong>。因此，让它们每天能得到休息以修复、重置和恢复节律是至关重要的。当它们都恢复活力时，就可以高效完成所有任务。这就好比一支管弦乐队，当所有乐器都协调一致且配合得当时，你听到的就是优美的旋律；否则，就是难以入耳的噪音。</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">通过建立一个持续的每日进食和禁食周期，机体会根据自然的昼夜节律重新调整热量摄入曲线。<strong>间歇性禁食</strong>策略应运而生，并已被证明可以减肥并延长许多物种的寿命以及提高认知能力，包括在啮齿类动物、灵长类动物以及人类衰老过程中引起广泛的健康改善。</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">目前应用最广泛的间歇性禁食策略是<strong>限时进食</strong>（TRF），即将进食时间窗缩窄至8小时。然而，对于那些想要通过间歇性禁食来减缓衰老的人来说，遵循这种饮食干预策略有些困难。在现代社会，人们已习惯了一日三餐，间歇性禁食的计划往往会受到饥饿感的挑战。而有些人通过强大的意志力战胜饥饿感后，却没收获到太多的健康改善。那你要问问自己，是不是禁食时间选错了。</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">北京时间9月30日，发表在<strong>《Nature》</strong>上的一项最新研究中，来自<strong>美国哥伦比亚大学领导的研究团队揭示了间歇性禁食如何在细胞内减慢衰老过程，并指出了延长寿命并改善健康的关键禁食时段。</strong></font></section><section style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><img src=\"https://cdn.linkresearcher.com/1zoe5s4h-u2hg-69y2-1hzk-7t8n5x4i\" style=\"\"></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">一般来说，<strong>限时进食</strong>（TRF）将食物摄入量限制在一天中的特定时间，但不限制营养或总热量的摄入。因此，<strong>时间的作用是一条关于禁食与健康长寿之间关系的重要线索</strong>，但是潜在的分子机制仍是个谜。</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">在这项研究中，研究人员使用果蝇进行了研究。尽管这种小飞虫看起来与人类截然不同，但它们的生物钟却与人类相似：白天活跃，晚上睡觉，同时也共享约70%的人类疾病相关基因。而且，果蝇还是一个非常好的衰老模型，因为它与人类的衰老方式也相似，而且由于其寿命仅有两个月，因此，衰老实验在技术上更易于操作。</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">为了测试延禁食的效果，研究人员给果蝇分为四组，实验持续40天。</font></section><section style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><img src=\"https://cdn.linkresearcher.com/651pstmv-lq7c-o0pz-un4b-5rec07ad\" style=\"\"></font></section><ul style=\"\"><li><p style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></p><p style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">第一组：24小时自由进食，不受限制；</font></p></li><li><p style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">第二组：标准的TRF，开灯后（模拟白天）12小时进食，关灯后12小时禁食；</font></p></li><li><p style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">第三组：隔日进食，即24小时禁食后第二天自由进食，不受限制；</font></p></li><li><section style=\"\"><strong><font style=\"color:rgb(0, 0, 0); font-size:16px;\">第四组为研究人员开发的一种新版限时进食策略（iTRF）方案组，这组果蝇在第一天只有在中午4小时时间进食，然后禁食20小时。到了第二天全天可以自由进食。</font></strong></section></li></ul><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">经过反复的实验结果显示，只有第四组，<strong>即iTRF方案显著延长了果蝇寿命（雌性延长了18%，雄性延长了13%）并延迟肌肉和肠道中老化标志物的出现。这意味着，iTRF方案还改善了果蝇的“健康期”。</strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><strong><br></strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">研究人员发现，iTRF增强了昼夜节律调节的转录，并且iTRF介导的寿命延长需要昼夜节律调节和<strong>自噬</strong>，这是一条保守的长寿途径。当<span style=\"\">敲除果蝇核心时钟基因或抑制自噬介导因子表达，以及改为白天禁食夜间进食，或在白天诱导自噬，均无法延长寿命。</span></font></section><p style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></p><p style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><img src=\"https://cdn.linkresearcher.com/fm0yq9hr-sk8p-ic29-x1qi-bk9smy6j\" style=\"\"></font></p><section style=\"text-align:center;\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><img src=\"https://cdn.linkresearcher.com/7cd2f6jo-vqif-0d3e-7jsi-uwtmzijo\" style=\"\"></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">因此，<strong>禁食的时机非常关键</strong>，也就是说，<strong>只有从晚上开始饿肚子，一直饿到第二天午餐时分的果蝇寿命才得到延长；而那些全天禁食，只在晚上吃东西的果蝇寿命没有改变。</strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><strong><br></strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">那些遵循间歇性禁食策略同时还在吃夜宵的人，是不是得到了什么启示？</font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><br></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><span style=\"\">研究人员还发现，</span><strong><span style=\"\">增强夜间自噬，能在随意进食的果蝇中起到与iTRF方案一样的有益作用。</span></strong><span style=\"\"></span></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><strong><span style=\"\"><br></span></strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">他们表示，<strong>如果能从药理学上加强夜间自噬，那么不用挨饿就可以获得同样的健康益处。</strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\"><strong><br></strong></font></section><section style=\"\"><font style=\"color:rgb(0, 0, 0); font-size:16px;\">总之，这项研究表明要想让间歇性禁食策略带来最大化的收益，昼夜节律调节的自噬是关键。由于是人类衰老过程中高度保守的过程，因此，该研究同时强调了刺激昼夜节律调节的自噬行为或药物干预手段可能会为人类提供类似延缓衰老甚至延长寿命的健康益处。</font></section></section>\n</div>"
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
