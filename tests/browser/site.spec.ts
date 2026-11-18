import { test, expect, type Page, type Locator } from '@playwright/test';

const password = 'test-password-2026';
async function signup(page: Page, handle: string) {
  const email = `${handle}-${Date.now()}@example.com`;
  await page.goto('./');
  await page.getByRole('link', { name: '로그인', exact: true }).click();
  await page.getByRole('button', { name: '회원가입', exact: true }).click();
  await expect(page.getByLabel('닉네임', { exact: true })).toHaveCount(0);
  await page.getByLabel('이메일', { exact: true }).fill(email);
  await expect(page.getByLabel('이메일', { exact: true })).toHaveAttribute('autocomplete', 'username');
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await expect(page.getByLabel('비밀번호', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByLabel('가입 이메일', { exact: true })).toHaveAttribute('readonly', '');
  await page.getByLabel('핸들', { exact: true }).fill(handle);
  await page.getByLabel('닉네임', { exact: true }).fill(handle);
  await page.getByRole('button', { name: '가입 완료', exact: true }).click();
  await expect(page.getByRole('heading', { name: '프로필', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '프로필 편집', exact: true })).toBeVisible();
  await openWall(page);
  return email;
}
async function openWall(page: Page) {
  await page.getByRole('link', { name: '풀림', exact: true }).click();
  await page.getByRole('link', { name: '담벼락', exact: true }).click();
}
async function openProfile(page: Page) {
  await page.getByRole('button', { name: '계정 메뉴' }).click();
  await page.getByRole('button', { name: '프로필', exact: true }).click();
}
async function post(page: Page, body: string) {
  await page.getByRole('button', { name: '새 글 쓰기', exact: true }).click();
  const composer = page.getByRole('dialog', { name: '새 글 쓰기', exact: true });
  await composer.getByLabel('게시할 글', { exact: true }).fill(body);
  await composer.getByRole('button', { name: '게시하기', exact: true }).click();
  await expect(composer.getByText('글을 게시했어요.', { exact: true })).toBeVisible();
  await composer.getByRole('button', { name: '닫기', exact: true }).click();
}
async function menu(card: Locator, item: string) {
  await card.getByRole('button', { name: '게시물 메뉴', exact: true }).click();
  await card.getByRole('button', { name: item, exact: true }).click();
}
async function quote(page: Page, card: Locator, body = '') {
  await card.getByRole('button', { name: /^리포스트 \d+$/ }).click();
  const composer = page.getByRole('dialog', { name: /리포스트 (작성|수정)/ });
  await composer.getByLabel('리포스트에 덧붙일 글', { exact: true }).fill(body);
  await composer.getByRole('button', { name: /^(리포스트하기|리포스트 저장)$/ }).click();
  await expect(composer).toHaveCount(0);
}
async function cancelQuote(page: Page, card: Locator) {
  await card.getByRole('button', { name: /^리포스트 \d+$/ }).click();
  const composer = page.getByRole('dialog', { name: '리포스트 수정', exact: true });
  page.once('dialog', dialog => dialog.accept());
  await composer.getByRole('button', { name: '리포스트 취소', exact: true }).click();
  await expect(composer).toHaveCount(0);
}
test.beforeAll(async () => {
  const response = await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-postpost/databases/(default)/documents', { method: 'DELETE' });
  expect(response.ok).toBeTruthy();
});

test('desktop navigation, private reactions, activity, exploration, inline search and menus', async ({ browser }) => {
  const first = await browser.newContext(); const second = await browser.newContext();
  const author = await first.newPage(); const reader = await second.newPage();
  try {
    await signup(author, 'writer');
    await post(author, '첫 번째 이야기 #일상 #React');
    const original = author.getByRole('article', { name: 'writer의 글', exact: true });
    await expect(original.getByText('@writer', { exact: true })).toBeVisible();
    expect(await original.locator('.post-body').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe(17);
    expect(await author.getByRole('navigation', { name: '서비스' }).getByRole('link').allTextContents()).toEqual(['', '', '']);
    await expect(author.getByRole('button', { name: '계정 메뉴', exact: true })).toHaveText('');
    await author.screenshot({ path: 'test-results/feed-desktop.png', fullPage: true });
    await signup(reader, 'reader');
    const foreign = reader.getByRole('article', { name: 'writer의 글', exact: true });
    await foreign.getByRole('button', { name: '좋아요 0', exact: true }).click();
    await expect(foreign.getByRole('button', { name: '좋아요 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await menu(original, '반응한 사람');
    const people = author.getByRole('dialog', { name: '반응한 사람 · 작성자만 공개' });
    await expect(people.getByText('@reader', { exact: true })).toBeVisible();
    await people.getByRole('link').filter({ hasText: '@reader' }).click();
    await expect(author.getByRole('heading', { name: '프로필', exact: true, level: 1 })).toBeVisible();
    await author.getByRole('button', { name: '이전 화면으로', exact: true }).click();
    await expect(author.getByRole('heading', { name: '담벼락', exact: true, level: 1 })).toBeVisible();

    await quote(reader, foreign);
    const shared = reader.getByRole('article', { name: 'reader의 리포스트', exact: true });
    await expect(shared).toBeVisible();
    await expect(original.getByRole('button', { name: '리포스트 1', exact: true })).toBeVisible();
    await cancelQuote(reader, foreign);
    await expect(shared).toHaveCount(0);
    await quote(reader, foreign);
    await expect(shared).toBeVisible();
    await shared.getByRole('link', { name: '원 포스트 보기', exact: true }).click();
    const detail = reader.getByRole('dialog', { name: '포스트 보기', exact: true });
    await expect(detail.getByText('첫 번째 이야기 #일상 #React', { exact: true })).toBeVisible();
    await reader.keyboard.press('Escape');

    await foreign.getByRole('button', { name: '게시물 메뉴', exact: true }).click();
    const bounds = await foreign.getByRole('button', { name: '링크 복사', exact: true }).locator('svg').evaluate(el => { const box = (el as SVGSVGElement).getBBox(); return { x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height }; });
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(24); expect(bounds.bottom).toBeLessThanOrEqual(24);
    await reader.keyboard.press('Escape');

    await openProfile(reader);
    await reader.getByRole('link', { name: '내 활동', exact: true }).click();
    await expect(reader.getByRole('heading', { name: '내 활동', exact: true })).toBeVisible();
    await reader.getByRole('button', { name: '좋아요', exact: true }).click();
    await expect(reader.getByRole('article', { name: 'writer의 글', exact: true })).toHaveCount(1);
    await openWall(reader);
    await reader.getByRole('link', { name: '탐색', exact: true }).click();
    await expect(reader.getByRole('heading', { name: '탐색', exact: true })).toBeVisible();
    await reader.locator('.discovery .tags button').filter({ hasText: '#일상' }).click();
    await expect(reader.getByRole('searchbox', { name: '검색어' })).toHaveValue('#일상');
    await expect(reader.getByRole('dialog')).toHaveCount(0);
    await reader.getByRole('searchbox', { name: '검색어' }).fill('@writer');
    await expect(foreign).toBeVisible();
    await openWall(reader);

    await menu(original, '수정');
    await original.getByLabel('글 수정', { exact: true }).fill('수정한 이야기 #기록');
    await original.getByRole('button', { name: '저장', exact: true }).click();
    await expect(foreign.getByText('수정한 이야기 #기록', { exact: true })).toBeVisible();
    await openProfile(reader);
    await reader.getByRole('link', { name: '내 활동', exact: true }).click();
    await reader.getByRole('button', { name: '좋아요', exact: true }).click();
    await expect(reader.getByText('수정한 이야기 #기록', { exact: true })).toBeVisible();
    await original.getByRole('button', { name: '게시물 메뉴', exact: true }).click();
    author.once('dialog', dialog => dialog.accept());
    await original.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(original).toHaveCount(0);
    await expect(reader.getByText('수정한 이야기 #기록', { exact: true })).toHaveCount(0);
    await openWall(reader);
    await shared.getByRole('link', { name: '원 포스트 보기', exact: true }).click();
    await expect(detail.getByText('삭제되었거나 찾을 수 없는 게시물입니다.')).toBeVisible();
  } finally { await first.close(); await second.close(); }
});

test('mobile two-step signup, email-only login, back navigation and persistent dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = await signup(page, 'phone');
  const nav = page.getByRole('navigation', { name: '서비스' });
  await expect(nav.getByRole('link')).toHaveCount(3);
  expect(await nav.getByRole('link').evaluateAll(items => items.map(item => item.getAttribute('aria-label')))).toEqual(['풀림', '수학', '영어']);
  await post(page, '모바일 글 #테스트');
  await openProfile(page);
  await expect(page.getByRole('heading', { name: '프로필', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '이전 화면으로', exact: true }).click();
  await expect(page.getByRole('heading', { name: '담벼락', exact: true })).toBeVisible();
  await openProfile(page);
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await openWall(page);
  await page.getByRole('link', { name: '탐색', exact: true }).click();
  await page.getByRole('link', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('button', { name: '닫기', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '이전 화면으로', exact: true }).click();
  await expect(page.getByRole('heading', { name: '탐색', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '로그인', exact: true }).click();
  await page.getByLabel('이메일', { exact: true }).fill('@phone');
  expect(await page.getByLabel('이메일', { exact: true }).evaluate(el => (el as HTMLInputElement).checkValidity())).toBeFalsy();
  await page.getByLabel('이메일', { exact: true }).fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('이메일 또는 비밀번호');
  expect(await page.locator('body').innerText()).not.toContain(email);
  await page.getByRole('button', { name: '비밀번호를 잊었나요?', exact: true }).click();
  await page.getByRole('button', { name: '재설정 메일 받기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('재설정 메일');
  await page.getByRole('button', { name: '이전 화면으로', exact: true }).click();
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '프로필', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('main').getByText('@phone', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '설정', exact: true }).first().click();
  await page.getByText('다크 모드', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await nav.getByRole('link').allTextContents()).toEqual(['', '', '']);
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(21, 21, 21)');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).color)).toBe('rgb(244, 244, 244)');
  expect(await page.locator('.pulim-header').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(21, 21, 21)');
  await openWall(page);
  await page.getByRole('link', { name: '검색', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: '검색어' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('searchbox', { name: '검색어' }).fill('@phone');
  await expect(page.getByRole('article').filter({ hasText: '모바일 글 #테스트' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(await page.locator('.post-body').first().evaluate(el => getComputedStyle(el).color)).toBe('rgb(244, 244, 244)');
  await expect(page.locator('.post').first()).toHaveCSS('background-color', 'rgb(34, 34, 34)');
  await page.screenshot({ path: 'test-results/search-dark-mobile.png', fullPage: true });
  await openWall(page);
  await page.screenshot({ path: 'test-results/feed-dark-mobile.png', fullPage: true });
});


test('quote text and independent comment threads survive original deletion safely', async ({ browser }) => {
  const ownerContext = await browser.newContext(); const readerContext = await browser.newContext(); const anonContext = await browser.newContext();
  const owner = await ownerContext.newPage(); const reader = await readerContext.newPage(); const anon = await anonContext.newPage();
  try {
    await signup(owner, 'comment_writer'); await post(owner, '댓글 기능 원문');
    await signup(reader, 'comment_reader');
    const original = owner.getByRole('article', { name: 'comment_writer의 글', exact: true });
    const foreign = reader.getByRole('article', { name: 'comment_writer의 글', exact: true });
    await quote(reader, foreign, '리포스트에 덧붙인 생각 #의견');
    const shared = reader.getByRole('article', { name: 'comment_reader의 리포스트', exact: true });
    await expect(shared.getByText('리포스트에 덧붙인 생각 #의견', { exact: true })).toBeVisible();
    await foreign.getByRole('button', { name: '댓글 0', exact: true }).click();
    const readerDetail = reader.getByRole('dialog', { name: '포스트 보기', exact: true });
    const readerComments = readerDetail.getByRole('region', { name: '댓글', exact: true });
    await readerComments.getByLabel('댓글 내용', { exact: true }).fill('원문 댓글');
    await readerComments.getByRole('button', { name: '댓글 등록', exact: true }).click();
    const ownComment = readerComments.getByRole('article', { name: 'comment_reader의 댓글', exact: true });
    await expect(ownComment.getByText('원문 댓글', { exact: true })).toBeVisible();
    await ownComment.getByRole('button', { name: '댓글 메뉴', exact: true }).click();
    await ownComment.getByRole('button', { name: '수정', exact: true }).click();
    await ownComment.getByLabel('댓글 수정', { exact: true }).fill('수정한 댓글');
    await ownComment.getByRole('button', { name: '저장', exact: true }).click();
    await expect(ownComment.getByText('수정한 댓글', { exact: true })).toBeVisible();
    await original.getByRole('button', { name: '댓글 1', exact: true }).click();
    const ownerDetail = owner.getByRole('dialog', { name: '포스트 보기', exact: true });
    const ownerComments = ownerDetail.getByRole('region', { name: '댓글', exact: true });
    const otherComment = ownerComments.getByRole('article', { name: 'comment_reader의 댓글', exact: true });
    await expect(otherComment.getByRole('button', { name: '댓글 메뉴', exact: true })).toHaveCount(0);
    await ownerComments.getByLabel('댓글 내용', { exact: true }).fill('작성자의 댓글');
    await ownerComments.getByRole('button', { name: '댓글 등록', exact: true }).click();
    await expect(readerComments.getByText('작성자의 댓글', { exact: true })).toBeVisible();
    await ownComment.getByRole('button', { name: '댓글 메뉴', exact: true }).click();
    reader.once('dialog', dialog => dialog.accept());
    await ownComment.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(otherComment).toHaveCount(0);
    await readerComments.getByLabel('댓글 내용', { exact: true }).fill('남겨 둘 원문 댓글');
    await readerComments.getByRole('button', { name: '댓글 등록', exact: true }).click();
    await reader.keyboard.press('Escape'); await owner.keyboard.press('Escape');
    await shared.getByRole('button', { name: '댓글 0', exact: true }).click();
    await readerDetail.getByRole('region', { name: '댓글', exact: true }).getByLabel('댓글 내용', { exact: true }).fill('리포스트만의 댓글');
    await readerDetail.getByRole('button', { name: '댓글 등록', exact: true }).click();
    await expect(original.getByRole('button', { name: '댓글 2', exact: true })).toBeVisible();
    await anon.goto('./#/wall');
    await anon.getByRole('article', { name: 'comment_writer의 글', exact: true }).getByRole('button', { name: '댓글 2', exact: true }).click();
    const anonDetail = anon.getByRole('dialog', { name: '포스트 보기', exact: true });
    await expect(anonDetail.getByText('남겨 둘 원문 댓글', { exact: true })).toBeVisible();
    await expect(anonDetail.getByLabel('댓글 내용', { exact: true })).toHaveCount(0);
    await original.getByRole('button', { name: '게시물 메뉴', exact: true }).click();
    owner.once('dialog', dialog => dialog.accept());
    await original.getByRole('button', { name: '삭제', exact: true }).click();
    await expect(anonDetail.getByText('삭제되었거나 찾을 수 없는 게시물입니다.')).toBeVisible();
    await expect(anonDetail.getByText('남겨 둘 원문 댓글', { exact: true })).toHaveCount(0);
    await expect(readerDetail.getByText('리포스트에 덧붙인 생각 #의견', { exact: true })).toBeVisible();
    await expect(readerDetail.getByText('리포스트만의 댓글', { exact: true })).toBeVisible();
    await expect(readerDetail.getByText('삭제되었거나 찾을 수 없는 원문입니다.')).toBeVisible();
    await reader.setViewportSize({ width: 390, height: 844 });
    await reader.evaluate(() => localStorage.setItem('postpost:theme', 'dark')); await reader.reload();
    await expect(readerDetail.getByText('리포스트만의 댓글', { exact: true })).toBeVisible();
    expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await reader.screenshot({ path: 'test-results/repost-comments-mobile.png', fullPage: true });
  } finally { await ownerContext.close(); await readerContext.close(); await anonContext.close(); }
});


test('one study document, shared dark theme and synchronized practice records', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 720 }, colorScheme: 'light' });
  await context.addInitScript(() => {
    if (location.protocol.startsWith('http')) localStorage.setItem('pulleem:guest:math:math-forge:theme', 'dark');
  });
  const second = await browser.newContext();
  const author = await context.newPage();
  const other = await second.newPage();
  let unblockMath!: () => void;
  const mathGate = new Promise<void>(resolve => { unblockMath = resolve; });
  await author.route('**/src/learning/engines/math.js*', async route => {
    await mathGate;
    await route.continue();
  });
  try {
    const email = await signup(author, 'study_user');
    const bar = author.locator('.pulim-header');
    const signature = () => bar.locator('.header-inner').evaluate(element => {
      const css = getComputedStyle(element);
      return [css.height, css.width, css.fontFamily, getComputedStyle(element.parentElement!).backgroundColor];
    });
    await expect(bar).toBeVisible();
    const originalBar = await signature();
    await author.evaluate(() => document.querySelector('.pulim-header')?.setAttribute('data-persistent', 'yes'));
    await author.getByRole('link', { name: '수학', exact: true }).click();
    await expect(author.getByRole('heading', { name: '수학', exact: true })).toBeVisible();
    await expect(author.locator('html')).toHaveCSS('background-color', 'rgb(21, 21, 21)');
    await expect(bar).toHaveAttribute('data-persistent', 'yes');
    expect(await signature()).toEqual(originalBar);
    await expect(author.locator('iframe')).toHaveCount(0);
    unblockMath();
    const math = author.locator('.study-math');
    const start = math.locator('#quick-practice');
    await expect(start).toHaveText(/오늘의 문제/);
    await expect(author.getByRole('button', { name: '설정', exact: true })).toHaveCount(1);
    expect(await author.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await author.screenshot({ path: 'test-results/pulim-math-dark.png' });
    await start.click();
    await expect(math.locator('#daily-navigation')).toBeVisible();
    await expect(author.locator('.app-header:visible, .session-header:visible')).toHaveCount(1);
    await expect(math.locator('#session-view .katex').first()).toBeVisible();
    await math.getByRole('link', { name: '연습 나가기' }).click();
    await author.getByRole('button', { name: '설정', exact: true }).click();
    const preferences = math.getByRole('dialog', { name: '설정', exact: true });
    await preferences.getByText('종이', { exact: true }).click();
    await expect(author.locator('html')).toHaveAttribute('data-theme', 'paper');
    await preferences.getByRole('button', { name: '닫기' }).click();
    await author.getByRole('link', { name: '영어', exact: true }).click();

    const english = author.locator('.study-english');
    await expect(english.getByRole('heading', { name: '오늘의 학습', level: 1 })).toBeVisible();
    await expect(author.locator('html')).toHaveAttribute('data-theme', 'paper');
    await expect(author.locator('.app-header:visible, .session-header:visible')).toHaveCount(1);
    expect(await author.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await author.getByRole('button', { name: '설정', exact: true }).click();
    const englishPreferences = english.getByRole('dialog', { name: '설정', exact: true });
    await englishPreferences.getByText('다크', { exact: true }).click();
    await englishPreferences.getByRole('button', { name: '닫기' }).click();
    await author.screenshot({ path: 'test-results/pulim-english-dark.png' });
    expect(await signature()).toEqual(originalBar);
    await english.getByRole('button', { name: '1구간 시작', exact: true }).click();
    await expect(author.locator('.app-header:visible, .session-header:visible')).toHaveCount(1);
    await english.getByRole('button', { name: '정답 확인', exact: true }).click();
    await english.getByRole('button', { name: '쉬움', exact: true }).click();
    await author.reload();
    await expect(author.locator('html')).toHaveAttribute('data-theme', 'dark');

    await other.goto('./#/me');
    await other.getByLabel('이메일', { exact: true }).fill(email);
    await other.getByLabel('비밀번호', { exact: true }).fill(password);
    await other.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(other.getByRole('heading', { name: '프로필', level: 1 })).toBeVisible();
    await other.getByRole('link', { name: '내 기록', exact: true }).first().click();
    await expect(other.getByText('as part of', { exact: true })).toBeVisible();
  } finally {
    unblockMath();
    await context.close();
    await second.close();
  }
});

test('English restores the vocabulary layout and uses Forge control roles on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('./#/english');
  const english = page.locator('.study-english');
  const gridColumns = (selector: string) => english.locator(selector).first().evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length);
  await expect(english.getByRole('heading', { name: '오늘의 학습' })).toBeVisible();
  expect(await gridColumns('.scope-options')).toBe(4);
  const colors = await english.locator('.mode-options .select-card > span').evaluateAll(elements =>
    elements.map(element => getComputedStyle(element).getPropertyValue('--rest-edge').trim()));
  expect(new Set(colors).size).toBe(3);
  await expect(english.locator('.mode-options .ui-strong').first()).toHaveCSS('font-weight', '700');
  await expect(english.locator('.home-metrics dt').first()).toHaveCSS('font-weight', '400');

  const segment = english.locator('.segment-card').first();
  const action = segment.getByRole('button', { name: '1구간 시작', exact: true });
  await expect(action).toHaveCSS('border-top-width', '0px');
  await expect(action).toHaveCSS('box-shadow', 'none');
  await expect(segment.locator('.segment-tags .icon').first()).toHaveCSS('width', '18px');
  await expect(action.locator('.icon')).toHaveCSS('width', '24px');
  const tagColors = await segment.locator('.segment-tags .context-chip').evaluateAll(items =>
    items.map(item => getComputedStyle(item).backgroundColor));
  expect(new Set(tagColors).size).toBe(4);
  await segment.locator('summary').click();
  await expect.poll(() => gridColumns('.segment-words')).toBeGreaterThan(1);
  const card = segment.locator('.word-flip').first();
  await expect(card.locator('.word-meaning')).toBeHidden();
  await card.click();
  await expect(card.locator('.word-meaning')).toBeVisible();
  await page.screenshot({ path: 'test-results/pulim-english-layout-desktop.png' });

  await page.setViewportSize({ width: 320, height: 720 });
  expect(await gridColumns('.scope-options')).toBe(2);
  expect(await gridColumns('.segment-words')).toBe(1);
  await english.locator('.mode-options input[value="choice"] + span').click();
  await action.click();
  const choice = english.locator('.choice-option').first();
  await expect(choice).toHaveCSS('display', 'grid');
  await choice.click();
  await expect(english.locator('.choice-correct')).toBeVisible();
  await expect(english.locator('.choice-correct')).toHaveCSS('opacity', '1');
  await english.getByRole('button', { name: '연습 나가기', exact: true }).click();
  await expect(english.locator('.saved-round .context-chip')).toHaveCount(3);
  await english.locator('.mode-options input[value="type"] + span').click();
  await action.click();
  const submit = english.getByRole('button', { name: '정답 확인', exact: true });
  await expect(submit).toHaveCSS('border-top-width', '2px');
  expect(await submit.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
  const actionPositions = await english.locator('.type-actions > button').evaluateAll(buttons =>
    buttons.map(button => Math.round(button.getBoundingClientRect().top)));
  expect(new Set(actionPositions).size).toBe(1);
  await english.getByRole('button', { name: '정답 보기', exact: true }).click();
  await expect(english.locator('.verdict.is-wrong')).toBeVisible();
  await page.screenshot({ path: 'test-results/pulim-english-layout-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
