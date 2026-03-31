var T=class{turndown(s){let e=new DOMParser().parseFromString(s,"text/html");return e.querySelectorAll("script, style, noscript").forEach(n=>n.remove()),this.convertNode(e.body)}convertNode(s){if(s.nodeType===Node.TEXT_NODE)return s.textContent||"";if(s.nodeType!==Node.ELEMENT_NODE)return"";let t=s,e=t.tagName.toLowerCase();switch(e){case"h1":return`# ${this.getTextContent(t)}

`;case"h2":return`## ${this.getTextContent(t)}

`;case"h3":return`### ${this.getTextContent(t)}

`;case"h4":return`#### ${this.getTextContent(t)}

`;case"h5":return`##### ${this.getTextContent(t)}

`;case"h6":return`###### ${this.getTextContent(t)}

`;case"p":return`${this.getTextContent(t)}

`;case"br":return`
`;case"hr":return`---

`;case"strong":case"b":return`**${this.getTextContent(t)}**`;case"em":case"i":return`*${this.getTextContent(t)}*`;case"a":{let n=t.getAttribute("href")||"",o=this.getTextContent(t);return o?`[${o}](${n})`:""}case"img":{let n=t.getAttribute("src")||"";return`![${t.getAttribute("alt")||""}](${n})

`}case"ul":case"ol":{let n=Array.from(t.children),o=e==="ul"?"-":"1.";return n.map(g=>`${o} ${this.getTextContent(g)}
`).join("")+`
`}case"table":return this.convertTable(t);case"code":return t.parentElement?.tagName==="PRE"?"":`\`${this.getTextContent(t)}\``;case"pre":{let n=t.querySelector("code");return"```\n"+(n?n.textContent:t.textContent)+"\n```\n\n"}case"blockquote":return this.getTextContent(t).split(`
`).map(o=>`> ${o}`).join(`
`)+`

`;default:{let n="";return t.childNodes.forEach(o=>{n+=this.convertNode(o)}),n}}}convertTable(s){let t=Array.from(s.querySelectorAll("tr"));if(t.length===0)return"";let e=[];for(let a of t){let m=Array.from(a.querySelectorAll("th, td")).map(k=>k.textContent?.trim().replace(/\n/g," ")||"");e.push(m)}if(e.length===0)return"";let n=e[0],o=n.map(()=>"---").join(" | "),g=e.slice(1).filter(a=>a.some(r=>r.trim()!=="")).map(a=>a.join(" | ")).join(`
`);return g?`${n.join(" | ")}
${o}
${g}

`:""}getTextContent(s){return s.textContent?.trim()||""}};function M(l,s){let e=new DOMParser().parseFromString(l,"text/html");switch(s){case"title":return e.title;case"author":return e.querySelector('meta[name="author"]')?.getAttribute("content");case"date":return e.querySelector('meta[name="date"]')?.getAttribute("content")||e.querySelector('meta[name="publishdate"]')?.getAttribute("content");default:return null}}function $(l){let s=[];for(let[t,e]of Object.entries(l)){s.push(`## ${t}
`);for(let[n,o]of Object.entries(e))s.push(`- **${n}**: ${o||"(\u7A7A)"}`);s.push("")}return s.join(`
`)}chrome.runtime.onMessage.addListener(async(l,s,t)=>{try{if(l.action==="getPageHtml"){let e=document.documentElement.outerHTML,n=document.querySelectorAll("iframe");console.log(`[URI-to-Markdown] \u68C0\u6D4B\u5230 ${n.length} \u4E2A iframe`);let o=[];for(let g of n)try{let a=g.contentDocument||g.contentWindow?.document;if(a){let r=a.body?.innerHTML||"",m=a.body?.textContent?.length||0;console.log(`[URI-to-Markdown] iframe \u5185\u5BB9\u957F\u5EA6\uFF1A${m} \u5B57\u7B26`),m>0&&(o.push(r),console.log("[URI-to-Markdown] \u5DF2\u63D0\u53D6 iframe \u5185\u5BB9"))}}catch(a){console.warn("[URI-to-Markdown] \u65E0\u6CD5\u8BBF\u95EE\u8DE8\u57DF iframe:",a)}o.length>0&&(e=e.replace("</body>","<!-- IFRAME_CONTENT_START -->"+o.join("<hr><!-- FRAME_SEPARATOR -->")+"<!-- IFRAME_CONTENT_END --></body>"),console.log(`[URI-to-Markdown] \u5DF2\u5408\u5E76 ${o.length} \u4E2A iframe \u5185\u5BB9`)),t({success:!0,html:e,url:document.URL,title:document.title,iframeCount:o.length})}if(l.action==="convert"){console.log("[URI-to-Markdown] \u5F00\u59CB\u8F6C\u6362\uFF0CHTML \u957F\u5EA6:",l.html?.length);let n=new T().turndown(l.html);console.log("[URI-to-Markdown] \u8F6C\u6362\u5B8C\u6210\uFF0CMarkdown \u957F\u5EA6:",n?.length);let o=l.options?.withMeta?{title:M(l.html,"title")||document.title,url:l.url,author:M(l.html,"author")||void 0,date:M(l.html,"date")||void 0}:void 0,g="";if(l.options?.withFields)try{let r={},m=["BUG \u5355\u671F\u9650\u4FE1\u606F","\u4E0A\u62A5\u4EBA\u4FE1\u606F","\u5BA2\u6237\u4FE1\u606F","\u8054\u7CFB\u4EBA\u4FE1\u606F","\u95EE\u9898\u63CF\u8FF0\u4FE1\u606F","\u5F00\u53D1\u4EBA\u5458\u586B\u5199","\u5907\u6CE8\u8BF4\u660E","\u8865\u4E01\u5305\u76F8\u5173","\u6838\u5FC3\u4EE3\u7801","\u8F6C\u5BA2\u5F00\u5904\u7406","\u4EE3\u7801\u68C0\u67E5\u7ED3\u679C","\u8BCA\u65AD\u7ED3\u8BBA","\u6D4B\u8BD5\u4EBA\u5458\u586B\u5199","\u5BA2\u5F00\u4EBA\u5458\u586B\u5199\u4FE1\u606F","\u533A\u57DF\u5BA2\u5F00","\u53D1\u8D77\u4EBA\u4EA4\u4ED8\u4FE1\u606F"],R=new DOMParser().parseFromString(l.html,"text/html"),w=Array.from(R.querySelectorAll("div")).filter(c=>{let i=c.textContent?.trim()||"";return i.length>0&&i.length<500&&(i.includes(":")||i.includes(":"))});console.log("[URI-to-Markdown] \u627E\u5230\u53EF\u80FD\u5305\u542B\u5B57\u6BB5\u7684 DIV \u6570\u91CF:",w.length),console.log("[URI-to-Markdown] \u524D 20 \u4E2A\u5B57\u6BB5\u7684 DIV:");for(let c=0;c<Math.min(20,w.length);c++){let i=w[c],u=i.textContent?.trim()||"",h=i.className||"no-class";console.log(`  ${c}: class="${h.substring(0,50)}" text="${u.substring(0,100)}..."`)}let p=[];w.forEach(c=>{let i=c.textContent?.trim();i&&i.length>0&&i.length<500&&p.push(i)}),console.log("[URI-to-Markdown] \u627E\u5230\u6587\u672C\u6570\u91CF:",p.length),console.log("[URI-to-Markdown] \u524D 30 \u4E2A\u6587\u672C:",p.slice(0,30));let d="";for(let c of p){if(c.includes("\u2588")||c.includes("\u2593")){let u=c.replace(/[█▓]/g,"").trim(),h=m.find(f=>u.includes(f));h&&(d=h,r[d]||(r[d]={}),console.log("[URI-to-Markdown] \u627E\u5230\u533A\u57DF:",d));continue}if(c.startsWith("\u6CE8\uFF1A")||c.startsWith("\u8BF4\u660E\uFF1A")||c.match(/^\d+、/))continue;let i=c.match(/^([^:：]{2,30})[:：]\s*(.+)$/);if(i){let u=i[1].trim(),h=i[2].trim();if(u.length>1&&u.length<50){if(!d){for(let f of m)if(u.includes(f.split(" ")[0])){d=f,r[d]||(r[d]={});break}}d&&(r[d][u]=h)}}}if(Object.keys(r).length===0){console.log("[URI-to-Markdown] \u4F7F\u7528\u5907\u7528\u65B9\u6848\uFF1A\u6B63\u5219\u63D0\u53D6");let c=l.html,i=/([^：:\n]{2,30})[：:]\s*([^\n：:]{1,100})/g,u;for(;(u=i.exec(c))!==null;){let h=u[1].trim(),f=u[2].trim();for(let x of m)if(h.includes(x.split(" ")[0])){r[x]||(r[x]={}),r[x][h]=f;break}}}g=$(r),console.log("[URI-to-Markdown] \u63D0\u53D6\u5230\u5B57\u6BB5\u533A\u57DF:",Object.keys(r).length),console.log("[URI-to-Markdown] \u5B57\u6BB5\u8BE6\u60C5:",r)}catch(r){console.error("[URI-to-Markdown] \u5B57\u6BB5\u63D0\u53D6\u5931\u8D25:",r)}let a=n||"";g&&(a+=`

---

## \u8868\u5355\u5B57\u6BB5\u8BE6\u60C5

`+g),t({success:!0,markdown:a,meta:o})}}catch(e){console.error("[URI-to-Markdown] \u9519\u8BEF:",e),t({success:!1,error:e instanceof Error?e.message:"\u64CD\u4F5C\u5931\u8D25"})}return!0});
