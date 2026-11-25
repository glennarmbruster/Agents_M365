function actionButton(label, onClick) {
  const button = element('button', label, 'lab-action');
  button.type = 'button';
  button.onclick = onClick;
  return button;
}

function practiceDesk() {
  const box = element('section', undefined, 'desk');
  box.setAttribute('aria-label','Practice desk');
  box.append(element('div','Practice desk · works offline','eyebrow'), element('h2','Harbor Shuttle & Ferry Notice Check'));
  const files = element('div', undefined, 'desk-files');
  const paper = element('article', undefined, 'note-paper');
  paper.setAttribute('aria-live','polite');
  const notice = 'Meet at Pier 6 at 9:15 a.m. Bring a hat.';
  const draft = 'Meet at Pier 6 at 9:50 a.m. Bring a hat.';
  const fileContents = {
    'schedule.txt': 'Saturday ferry walk\nMeet at Pier 6 at 9:15 a.m.\nBring a hat.',
    'notice.txt': draft
  };
  function select(name) {
    for (const b of files.children) b.setAttribute('aria-pressed',String(b.textContent === name));
    paper.replaceChildren(element('h3',name),element('p',fileContents[name]));
  }
  for (const name of Object.keys(fileContents)) files.append(actionButton(name,()=>select(name)));
  const verdict = element('p', undefined, 'desk-verdict');
  verdict.setAttribute('role','status');
  const choices = element('div', undefined, 'desk-choices');
  const accept = actionButton('Use 9:15 a.m.',()=>decide(true));
  const reject = actionButton('Keep 9:50 a.m.',()=>decide(false));
  function decide(correct) {
    if (!correct) {
      verdict.textContent = 'Look again at schedule.txt. The ferry leaves at 9:15 a.m. Which time makes the notice match?';
      return;
    }
    fileContents['notice.txt'] = notice;
    select('notice.txt');
    verdict.textContent = 'Fixed! Both notes now say Pier 6 at 9:15 a.m., and the hat reminder stayed intact.';
    accept.disabled = reject.disabled = true;
  }
  const reset = actionButton('Start practice again',()=>{
    fileContents['notice.txt'] = draft;
    accept.disabled = reject.disabled = false;
    verdict.textContent = '';
    select('schedule.txt');
  });
  choices.append(accept, reject, reset);
  box.append(files,paper,element('h3','Which time belongs in notice.txt?'),choices,verdict);
  select('schedule.txt');
  return box;
}

function stepControls(list, single) {
  const nav = element('div', undefined, 'step-controls');
  nav.setAttribute('role','group');
  nav.setAttribute('aria-label','Walkthrough steps');
  const items = Array.from(list.children);
  const progress = element('span',undefined,'step-count');
  progress.setAttribute('role','status');
  let current = 0;
  const back = actionButton('← Previous step',()=>{ current--; draw(); });
  const next = actionButton('Next step →',()=>{ current++; draw(); });
  const toggle = actionButton('',()=>{ single = !single; draw(); });
  function draw() {
    for (const [i, item] of items.entries()) { item.hidden = single && i !== current; item.value = i + 1; }
    progress.textContent = single ? 'Step ' + (current + 1) + ' of ' + items.length : items.length + ' steps';
    toggle.textContent = single ? 'Show all steps' : 'One step at a time';
    back.hidden = next.hidden = !single;
    back.disabled = current === 0;
    next.disabled = current === items.length - 1;
  }
  nav.append(progress,back,next,toggle);
  draw();
  return nav;
}

function picture(figure) {
  const view = element('figure',undefined,'book-figure');
  const photo = element('img');
  photo.alt = figure.alt;
  photo.src = assetURL('./pictures/' + figure.file);
  photo.loading = 'lazy';
  const caption = element('figcaption');
  caption.append(element('span',figure.caption + ' · ' + figure.credit));
  const enlarge = actionButton('',()=>{
    const dialog = element('dialog',undefined,'image-view');
    const close = actionButton('Close picture',()=>dialog.close());
    const big = photo.cloneNode();
    big.loading = 'eager';
    dialog.setAttribute('aria-label','Enlarged diagram');
    dialog.append(close,big,element('p',figure.caption));
    dialog.onclose = ()=>dialog.remove();
    document.body.append(dialog);
    dialog.showModal();
  });
  enlarge.className = 'enlarge';
  enlarge.setAttribute('aria-label','Enlarge diagram: ' + figure.caption);
  enlarge.append(photo,element('span','Tap to enlarge'));
  view.append(enlarge,caption);
  return view;
}
