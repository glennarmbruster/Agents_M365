class BookPager extends HTMLElement {
  static get observedAttributes() { return ['hidden']; }
  attributeChangedCallback() {
    if (this.topNavigation) this.topNavigation.hidden = this.hidden;
  }
  disconnectedCallback() {
    this.topNavigation?.remove();
    this.topNavigation = null;
  }
  setPage(number, total, noun, openPage, openIndex) {
    if (!this.shadowRoot) {
      const root = this.attachShadow({mode:'open'});
      root.innerHTML = `
      <style>
        :host{display:block;margin:1.6rem 0 .5rem;color:inherit}
        :host([hidden]){display:none}
        nav{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.55rem;border-top:1px solid var(--line,#aaa);padding-top:.9rem}
        form{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem}label{font:inherit;font-weight:600}
        button,input{font:inherit;color:inherit;background:#fffdf6;border:1px solid #145756;border-radius:.35rem;box-sizing:border-box;min-height:44px;padding:.35rem .7rem}
        input{width:5.5em;font-size:16px}button{cursor:pointer;font-weight:600;color:#145756}button:disabled{opacity:.4;cursor:default}
      </style>
      <nav aria-label="Browse this book"><button type="button" id="prev">← Back</button>
      <button type="button" id="index">Contents</button>
      <form><label for="number"></label><input type="number" id="number" min="1" step="1" inputmode="numeric" required><button>Go</button></form>
      <button type="button" id="next">Next →</button></nav>`;
    }
    if (this.hasAttribute('top') && !this.topNavigation) {
      const navigation = document.createElement('div');
      navigation.className = 'book-top-navigation';
      navigation.hidden = this.hidden;
      const top = navigation.attachShadow({mode:'open'});
      top.innerHTML = `
      <style>
        :host{display:block;margin:0 0 .8rem;color:inherit}
        :host([hidden]){display:none}
        nav{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:.5rem}
        button{font:inherit;color:#145756;background:#fffdf6;border:1px solid #145756;border-radius:.35rem;min-height:44px;padding:.4rem .75rem;cursor:pointer;font-weight:600}
        button:disabled{opacity:.4;cursor:default}
      </style>
      <nav aria-label="Browse this book, top"><button type="button" id="prev">← Previous</button><button type="button" id="next">Next →</button></nav>`;
      const selector = this.getAttribute('top');
      const target = selector ? this.parentElement.querySelector(selector) : this.parentElement;
      target.prepend(navigation);
      this.topNavigation = navigation;
    }
    const root=this.shadowRoot, input=root.getElementById('number');
    root.querySelector('label').textContent='Go to '+noun+' #';
    input.placeholder=String(number);input.max=String(total);input.value='';
    for (const [id, target] of [['prev',number-1],['next',number+1]]) {
      for (const controls of [root, this.topNavigation?.shadowRoot].filter(Boolean)) {
        const button=controls.getElementById(id);
        button.disabled=target<1||target>total;
        button.onclick=()=>openPage(target);
      }
    }
    root.getElementById('index').onclick=openIndex;
    root.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      if(input.checkValidity())openPage(input.valueAsNumber);
    };
  }
}
customElements.define('book-pager',BookPager);
