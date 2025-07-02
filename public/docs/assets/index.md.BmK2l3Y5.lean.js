import{_ as h,c as b,o as v,ae as x}from"./chunks/framework.B-Fvu48Z.js";if(typeof window<"u"){let l=function(e,t){const i=document.getElementById("dynamic-wiki-content");let n=t.length>0?t[0]:null;const d=`
      <div style="display: flex; gap: 2rem; min-height: 70vh;">
        <!-- 侧边栏 -->
        <div id="wiki-sidebar" style="width: 280px; flex-shrink: 0; background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 1px solid #e9ecef; max-height: 80vh; overflow-y: auto;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem;">文档目录</h3>
          <div id="categories-list"></div>
        </div>
        
        <!-- 主内容区 -->
        <div style="flex: 1; min-width: 0;">
          <div id="document-content" style="background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div id="document-header"></div>
            <div id="document-body"></div>
          </div>
        </div>
      </div>
    `;i.innerHTML=d,m(e,t),n?p(n,e):y()},m=function(e,t){const i=document.getElementById("categories-list");let n="";e.forEach(o=>{const u=t.filter(c=>c.categoryId===o.id);u.length>0&&(n+=`
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #34495e; font-weight: 600;">${o.name}</h4>
            <ul style="list-style: none; margin: 0; padding: 0;">
              ${u.map(c=>`
                <li style="padding: 0.5rem 0.75rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;" 
                    onmouseover="this.style.background='#e3f2fd'; this.style.color='#1976d2'"
                    onmouseout="this.style.background=''; this.style.color=''"
                    onclick="selectDocument('${c.id}')">
                  ${c.title}
                </li>
              `).join("")}
            </ul>
          </div>
        `)});const d=t.filter(o=>!o.categoryId||o.categoryId==="");d.length>0&&(n+=`
        <div style="margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #34495e; font-weight: 600;">未分类</h4>
          <ul style="list-style: none; margin: 0; padding: 0;">
            ${d.map(o=>`
              <li style="padding: 0.5rem 0.75rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;" 
                  onmouseover="this.style.background='#e3f2fd'; this.style.color='#1976d2'"
                  onmouseout="this.style.background=''; this.style.color=''"
                  onclick="selectDocument('${o.id}')">
                ${o.title}
              </li>
            `).join("")}
          </ul>
        </div>
      `),i.innerHTML=n},g=function(e){const t=a.find(i=>i.id===e);t&&(p(t,r),document.querySelectorAll("#categories-list li").forEach(i=>{i.style.background="",i.style.color=""}),event.target.style.background="#2196f3",event.target.style.color="white")},p=function(e,t){const i=document.getElementById("document-header"),n=document.getElementById("document-body"),d=f(e.categoryId,t),o=e.updatedAt?new Date(e.updatedAt).toLocaleDateString("zh-CN"):"未知";i.innerHTML=`
      <h1 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 2rem;">${e.title}</h1>
      <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #6c757d; margin-bottom: 2rem; border-bottom: 1px solid #e9ecef; padding-bottom: 1rem;">
        <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500;">${d}</span>
        <span>最后更新：${o}</span>
      </div>
    `,n.innerHTML=`<div style="line-height: 1.6; color: #2c3e50;">${e.content}</div>`},y=function(){const e=document.getElementById("document-header"),t=document.getElementById("document-body");e.innerHTML=`
      <h1 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 2rem;">欢迎使用 MXacc 文档中心</h1>
    `,t.innerHTML=`
      <div style="text-align: center; padding: 3rem; color: #6c757d;">
        <p>请从左侧选择一篇文档查看。</p>
        <p>如果您是管理员，可以通过管理控制台创建和编辑文档。</p>
        <p style="margin-top: 2rem; font-style: italic;">文档内容通过数据库动态加载，管理员可在后台实时编辑。</p>
      </div>
    `},f=function(e,t){if(!e)return"未分类";const i=t.find(n=>n.id===e);return i?i.name:"未分类"},a=[],r=[];document.addEventListener("DOMContentLoaded",function(){s()});async function s(){try{const[e,t]=await Promise.all([fetch("/api/social/content?action=wiki&type=categories"),fetch("/api/social/content?action=wiki&type=list")]),i=await e.json(),n=await t.json();i.success&&n.success?(r=i.data||[],a=n.data||[],l(r,a)):document.getElementById("dynamic-wiki-content").innerHTML='<div style="text-align: center; padding: 2rem; color: red;"><p>加载文档失败，请稍后重试</p></div>'}catch(e){console.error("加载Wiki内容失败:",e),document.getElementById("dynamic-wiki-content").innerHTML='<div style="text-align: center; padding: 2rem; color: red;"><p>网络错误，请检查连接后重试</p></div>'}}window.selectDocument=g}const D=JSON.parse('{"title":"MXacc 文档中心","description":"","frontmatter":{"layout":"page"},"headers":[],"relativePath":"index.md","filePath":"index.md","lastUpdated":1751436438000}'),k={name:"index.md"};function w(a,r,s,l,m,g){return v(),b("div",null,r[0]||(r[0]=[x("",3)]))}const $=h(k,[["render",w]]);export{D as __pageData,$ as default};
