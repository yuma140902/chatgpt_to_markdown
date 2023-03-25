// ==UserScript==
// @name               ChatGPT_to_Markdown
// @namespace          https://yuma14.net/
// @version            1.0.0
// @author             yuma14
// @description        Extract chat logs from ChatGPT webpage in Markdown format into clipboard.
// @description:ja-jp  ChatGPTのウェブページから会話履歴をマークダウン形式で抽出し、クリップボードへ書き出します
// @match              https://chat.openai.com/*
// @run-at             context-menu
// @grant              GM_setClipboard
// ==/UserScript==

(function() {

// logElementのうち、ユーザーアイコンを含む方の部分を返す
function getHeaderElement(logElement) {
  return logElement.querySelector(':scope > div > div:first-child');
}

// logElementのうち、発言内容を含む方の部分を返す
function getBodyElement(logElement) {
  return logElement.querySelector(':scope > div > div:last-child');
}

// logElementがChatGPTによるものならtrue、ユーザーによるものならfalse
function logIsByGPT(logElement) {
  const header_icon = getHeaderElement(logElement).querySelector(':scope img');
  return !header_icon;
}

// logElementから発言者の名前を返す
function getUserName(logElement) {
  if(logIsByGPT(logElement)) {
    return 'User';
  }
  else {
    return 'ChatGPT';
  }
}


// logElementの発言内容の部分をマークダウン形式に変換する
function convertBodyToMd(logElement) {
  console.log("logElement", logElement);

  if(logIsByGPT(logElement)) {
    console.log("this is by GPT");
    return convertGPTBodyToMd(logElement);
  }
  else {
    console.log("this is by User");
    return convertUserBodyToMd(logElement);
  }
}

// logElementがユーザーの発言であるとき、その内容をマークダウン形式に変換する
function convertUserBodyToMd(logElement) {
  // ユーザーはただのテキストしか送れないので、単にinnerTextを返せばよい
  return logElement.innerText + "\n";
}

// logElementがGPTの発言であるとき、その内容をマークダウン形式に変換する
function convertGPTBodyToMd(logElement) {
  // ChatGPTはマークダウン形式で応答しているようだが、HTMLに変換されてしまった状態で表示されるので、もとに戻す必要がある
  const markdownDivElem = getBodyElement(logElement).querySelector(':scope .markdown');

  if(!markdownDivElem) return "";

  let md = "";

  markdownDivElem.childNodes.forEach(child => {
    console.log("parsing", child);
    if(child.tagName == 'PRE') {
      md += parsePre(child);
    }
    else if(child.tagName == 'UL') {
      md += parseUl(child);
    }
    else if(child.tagName == 'OL') {
      md += parseOl(child);
    }
    else {
      md += child.innerText + "\n";
    }
    md += "\n";
  });

  return md;
}

function parsePre(elem) {
  const langSpanElem = elem.querySelector(':scope > div > div:first-child > span');
  const lang = langSpanElem ? langSpanElem.innerText : "text";
  const codeElem = elem.querySelector(':scope code');
  const code = codeElem.innerText;

  let s = "```";
  s += lang;
  s += "\n";
  s += code;
  s += "```\n";

  console.log("parsed pre", s);

  return s;
}

function parseUl(elem) {
  let s = "";
  elem.childNodes.forEach(li => {
    s += "- "
    s += li.innerText;
    s += "\n";
  });
  
  console.log("parsed ul", s);

  return s;
}

function parseOl(elem) {
  let s = "";
  let i = 1;
  elem.childNodes.forEach(li => {
    s += i + ". ";
    s += li.innerText;
    s += "\n";
    i++;
  });

  console.log("parsed ol", s);
  
  return s;
}

function main() {
  // "Model: Default (GPT-3.5)"などと書いてある部分
  const logsHeader = document.querySelector('main > div:first-child > div:first-child > div:first-child > div:first-child > div:first-child');
  const modelName = logsHeader ? logsHeader.innerText : "GPT-3.5";

  // ユーザーまたはChatGPTのアイコンと発言内容を含むdivのリスト
  const logs = document.querySelectorAll('main > div:first-child > div:first-child > div:first-child > div:first-child > div.group');

  console.log("logs:", logs);

  let md = "";

  md += "Model Name: " + modelName + "\n\n";

  logs.forEach(log => {
    const user_name = getUserName(log);
    const body_md = convertBodyToMd(log);
    md += "## " + user_name + "\n";
    md += "\n";
    md += body_md;
    md += "\n";
  });

  GM_setClipboard(md);
}

main();

})();
