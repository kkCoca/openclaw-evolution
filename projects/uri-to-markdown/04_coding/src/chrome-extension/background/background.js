var i=class{turndown(o){let n=new DOMParser().parseFromString(o,"text/html");return n.querySelectorAll("script, style, noscript").forEach(e=>e.remove()),this.convertNode(n.body)}convertNode(o){if(o.nodeType===Node.TEXT_NODE)return o.textContent||"";if(o.nodeType!==Node.ELEMENT_NODE)return"";let t=o,n=t.tagName.toLowerCase();switch(n){case"h1":return`# ${this.getTextContent(t)}

`;case"h2":return`## ${this.getTextContent(t)}

`;case"h3":return`### ${this.getTextContent(t)}

`;case"h4":return`#### ${this.getTextContent(t)}

`;case"h5":return`##### ${this.getTextContent(t)}

`;case"h6":return`###### ${this.getTextContent(t)}

`;case"p":return`${this.getTextContent(t)}

`;case"br":return`
`;case"hr":return`---

`;case"strong":case"b":return`**${this.getTextContent(t)}**`;case"em":case"i":return`*${this.getTextContent(t)}*`;case"a":{let e=t.getAttribute("href")||"",r=this.getTextContent(t);return r?`[${r}](${e})`:""}case"img":{let e=t.getAttribute("src")||"";return`![${t.getAttribute("alt")||""}](${e})

`}case"ul":case"ol":{let e=Array.from(t.children),r=n==="ul"?"-":"1.";return e.map(a=>`${r} ${this.getTextContent(a)}
`).join("")+`
`}case"table":return this.convertTable(t);case"code":return t.parentElement?.tagName==="PRE"?"":`\`${this.getTextContent(t)}\``;case"pre":{let e=t.querySelector("code");return"```\n"+(e?e.textContent:t.textContent)+"\n```\n\n"}case"blockquote":return this.getTextContent(t).split(`
`).map(r=>`> ${r}`).join(`
`)+`

`;default:{let e="";return t.childNodes.forEach(r=>{e+=this.convertNode(r)}),e}}}convertTable(o){let t=Array.from(o.querySelectorAll("tr"));if(t.length===0)return"";let n=[];for(let c of t){let l=Array.from(c.querySelectorAll("th, td")).map(h=>h.textContent?.trim().replace(/\n/g," ")||"");n.push(l)}if(n.length===0)return"";let e=n[0],r=e.map(()=>"---").join(" | "),a=n.slice(1).filter(c=>c.some(u=>u.trim()!=="")).map(c=>c.join(" | ")).join(`
`);return a?`${e.join(" | ")}
${r}
${a}

`:""}getTextContent(o){return o.textContent?.trim()||""}};chrome.runtime.onMessage.addListener((s,o,t)=>{if(s.action==="convert")try{let e=new i().turndown(s.html),r=s.options?.withMeta?{title:m(s.html,"title")||document.title,url:s.url}:void 0;t({success:!0,markdown:e,meta:r})}catch(n){t({success:!1,error:n instanceof Error?n.message:"\u8F6C\u6362\u5931\u8D25"})}return!0});function m(s,o){let n=new DOMParser().parseFromString(s,"text/html");switch(o){case"title":return n.title;case"author":return n.querySelector('meta[name="author"]')?.getAttribute("content");case"date":return n.querySelector('meta[name="date"]')?.getAttribute("content")||n.querySelector('meta[name="publishdate"]')?.getAttribute("content");default:return null}}
