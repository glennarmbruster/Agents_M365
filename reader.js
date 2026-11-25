const portable = window.portableCopilotAgentsBook;
const assetURL = path => portable?.media[path] || path;
const byId = id => document.getElementById(id);
let groups = [];
let allPages = [];
let illustrations = [];

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function isComplete(id) {
  try { return localStorage.getItem('m365-engineer-agents-v1.done.' + id) === '1'; } catch { return false; }
}
function setComplete(id, val) {
  try { if (val) localStorage.setItem('m365-engineer-agents-v1.done.' + id, '1'); else localStorage.removeItem('m365-engineer-agents-v1.done.' + id); } catch {}
}

function makeTable(table, title) {
  const wrap = element('div', undefined, 'table-wrap');
  const grid = element('table');
  const row = grid.createTHead().insertRow();
  for (const label of table.columns) {
    const cell = element('th', label);
    cell.scope = 'col';
    row.append(cell);
  }
  const body = grid.createTBody();
  for (const cells of table.rows) {
    const line = body.insertRow();
    cells.forEach((value, index) => {
      const cell = element(index ? 'td' : 'th', value);
      if (!index) cell.scope = 'row';
      line.append(cell);
    });
  }
  wrap.append(grid);
  return wrap;
}

function sourceLinks(references) {
  if (!references || !references.length) return null;
  const details = element('details', undefined, 'sources');
  details.append(element('summary', 'Official Microsoft Learn Sources (' + references.length + ')'));
  const ul = element('ul');
  for (const [name, url] of references) {
    const li = element('li');
    const a = element('a', name);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    li.append(a);
    ul.append(li);
  }
  details.append(ul);
  return details;
}

function showContents() {
  const query = byId('query').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = document.createDocumentFragment();
  const labsOnly = location.hash === '#labs';
  const guidesOnly = location.hash === '#start';
  const picsOnly = location.hash === '#pictures';

  byId('gallery').hidden = !picsOnly;
  byId('catalog').hidden = picsOnly;
  byId('guide-door').hidden = labsOnly || guidesOnly || picsOnly;
  byId('lab-door').hidden = labsOnly || guidesOnly || picsOnly;
  document.querySelector('.front').hidden = labsOnly || guidesOnly || picsOnly;
  byId('contents-title').textContent = labsOnly ? '24 Hands-On Labs (Simple to Complex)' : guidesOnly ? 'Illustrated First Steps' : 'Table of Contents';

  let count = 0;
  for (const group of groups) {
    if (labsOnly && !group.track) continue;
    if (guidesOnly && !group.guide) continue;
    const found = group.items.filter(ch => query.every(term => ch.search.includes(term)));
    if (!found.length) continue;

    const block = element('section', undefined, group.track ? 'group track' : 'group');
    const headingText = group.track
      ? group.title + ' (' + group.items.filter(i => isComplete(i.id)).length + '/' + group.items.length + ' completed)'
      : group.title;
    block.append(element('h3', headingText, 'group-heading'));

    const list = element('ol');
    for (const chapter of found) {
      const row = element('li');
      const link = element('a', undefined, 'entry');
      link.href = '#' + chapter.id;
      const name = element('span');
      name.append(element('span', chapter.title, 'lab-entry-title'));
      if (chapter.level) {
        const done = isComplete(chapter.id);
        link.classList.toggle('done', done);
        name.append(element('small', chapter.level + (done ? ' · Completed' : '')));
      }
      link.append(element('span', String(chapter.number).padStart(2, '0'), 'num'), name);
      row.append(link);
      list.append(row);
    }
    count += found.length;
    block.append(list);
    result.append(block);
  }
  byId('groups').replaceChildren(result);
  byId('matches').textContent = query.length ? (count ? count + (count === 1 ? ' matching lesson.' : ' matching lessons.') : 'No matches found. Try another keyword.') : '';
}

function renderGallery() {
  const thumbs = byId('thumbs');
  thumbs.replaceChildren();
  for (const fig of illustrations) {
    const a = element('a', undefined, 'thumb');
    a.href = '#' + fig.lesson;
    const img = element('img');
    img.src = assetURL('./pictures/' + fig.file);
    img.alt = fig.alt;
    a.append(img, element('strong', fig.alt), element('span', fig.caption));
    thumbs.append(a);
  }
}

function openChapter(item) {
  byId('index').hidden = true;
  byId('chapter').hidden = false;
  byId('group-name').textContent = item.groupTitle + (item.level ? ' · ' + item.level : '');
  byId('chapter-title').textContent = item.title;
  byId('summary').textContent = item.summary || '';
  byId('review-date').textContent = item.lastVerified ? 'Verified ' + item.lastVerified : '';

  const body = byId('body');
  body.replaceChildren();

  if (item.id === 'first-project') {
    body.append(practiceDesk());
  }

  const lessonFigs = illustrations.filter(f => f.lesson === item.id);
  for (const fig of lessonFigs) {
    body.append(picture(fig));
  }

  if (item.where) {
    const w = element('div', undefined, 'practice');
    w.append(element('h3', 'Where to work'), element('p', item.where.join(' ')));
    body.append(w);
  }
  if (item.actions) {
    const list = element('ol', undefined, 'step-list');
    for (const act of item.actions) {
      const li = element('li');
      li.append(
        element('h3', act.title),
        element('p', 'Do: ' + act.do),
        element('p', 'What you will see: ' + act.see),
        element('div', 'If stuck: ' + act.stuck, 'step-help')
      );
      list.append(li);
    }
    body.append(stepControls(list, false), list);
  }

  if (item.intro) {
    const intro = element('div', undefined, 'chapter-intro');
    intro.append(
      element('h2', 'What it is'), element('p', item.intro.what),
      element('h2', 'How it works'), element('p', item.intro.features)
    );
    const dl = element('dl', undefined, 'role-list');
    dl.append(
      element('dt', 'SharePoint & Graph Grounding'), element('dd', item.intro.m365),
      element('dt', 'Exchange & Teams Governance'), element('dd', item.intro.exchange),
      element('dt', 'Manifest & ALM Architecture'), element('dd', item.intro.developer)
    );
    intro.append(dl);
    const src = sourceLinks(item.intro.sources);
    if (src) intro.append(src);
    body.append(intro);
  }

  if (item.sections) {
    for (const sec of item.sections) {
      const s = element('section', undefined, 'section');
      s.append(element('h2', sec.title));
      for (const p of (sec.paragraphs || [])) s.append(element('p', p));
      if (sec.table) s.append(makeTable(sec.table, sec.title));
      if (sec.exercise) {
        const ex = element('div', undefined, 'practice');
        ex.append(element('h3', 'Quick Check'), element('p', sec.exercise.prompt));
        const det = element('details');
        det.append(element('summary', 'Show answer'));
        for (const a of sec.exercise.answer) det.append(element('p', a));
        ex.append(det);
        s.append(ex);
      }
      const src = sourceLinks(sec.sources);
      if (src) s.append(src);
      body.append(s);
    }
  }

  if (item.steps) {
    const req = element('div', undefined, 'practice');
    req.append(
      element('h3', 'What You Need'), element('p', item.requires),
      element('h3', 'Agent Instructions / Configuration'),
      element('pre', item.prompt, 'step-code')
    );
    body.append(req);

    const list = element('ol', undefined, 'step-list');
    for (const st of item.steps) {
      const li = element('li');
      li.append(element('h3', st.title), element('p', st.text));
      if (st.code) li.append(element('pre', st.code, 'step-code'));
      if (st.help) li.append(element('div', 'Tip: ' + st.help, 'step-help'));
      list.append(li);
    }
    body.append(stepControls(list, false), list);

    if (item.check) {
      const chk = element('div', undefined, 'practice');
      chk.append(element('h3', 'How to Verify Success'));
      const ul = element('ul');
      for (const c of item.check) ul.append(element('li', c));
      chk.append(ul);
      body.append(chk);
    }

    const doneBox = element('div', undefined, 'lab-complete-box');
    const statusText = element('strong', isComplete(item.id) ? 'Status: Completed ✓' : 'Status: Not marked complete yet');
    const btn = actionButton(isComplete(item.id) ? 'Mark Incomplete' : 'Mark Lab Complete ✓', () => {
      const nextState = !isComplete(item.id);
      setComplete(item.id, nextState);
      statusText.textContent = nextState ? 'Status: Completed ✓' : 'Status: Not marked complete yet';
      btn.textContent = nextState ? 'Mark Incomplete' : 'Mark Lab Complete ✓';
    });
    btn.classList.add('primary');
    doneBox.append(statusText, btn);
    body.append(doneBox);

    const src = sourceLinks(item.sources);
    if (src) body.append(src);
  }

  if (item.roles) {
    const rBox = element('div', undefined, 'action-card');
    rBox.append(element('h3', 'Practical Applications'));
    const ul = element('ul');
    for (const r of item.roles) ul.append(element('li', r));
    rBox.append(ul);
    body.append(rBox);
  }

  const pager = document.querySelector('book-pager');
  pager.setPage(item.globalIndex + 1, allPages.length, 'Chapter', idx => {
    location.hash = '#' + allPages[idx - 1].id;
  }, () => {
    location.hash = '#contents';
  });
  window.scrollTo(0, 0);
}

function route() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash || hash === 'contents' || hash === 'start' || hash === 'labs' || hash === 'pictures') {
    byId('chapter').hidden = true;
    byId('index').hidden = false;
    showContents();
    return;
  }
  const found = allPages.find(p => p.id === hash);
  if (found) openChapter(found);
  else {
    byId('chapter').hidden = true;
    byId('index').hidden = false;
    showContents();
  }
}

async function init() {
  const loadJson = async path => {
    if (portable?.json['./' + path]) return portable.json['./' + path];
    const r = await fetch('./' + path);
    return r.json();
  };
  const manifest = await loadJson('edition.json');
  illustrations = await loadJson('content/figures.json');
  byId('edition').textContent = 'Edition verified ' + manifest.reviewed + ' · ' + manifest.title;

  let counter = 1;
  for (const g of manifest.groups) {
    const items = await loadJson('content/' + g.file);
    const enriched = items.map(it => {
      const obj = {
        ...it,
        number: counter++,
        globalIndex: allPages.length,
        groupTitle: g.title,
        search: JSON.stringify(it).toLowerCase()
      };
      allPages.push(obj);
      return obj;
    });
    groups.push({ ...g, items: enriched });
  }
  const labGroup = groups.find(g => g.track);
  if (labGroup) {
    byId('lab-count').textContent = labGroup.items.length + ' hands-on labs progressing from Starter to Expert.';
  }
  renderGallery();
  byId('query').addEventListener('input', showContents);
  window.addEventListener('hashchange', route);
  route();
}
init();
