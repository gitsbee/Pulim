import { base } from '../hooks/useNavigation';
import Icon from './Icon';

const subjects = [
  { id: 'math', title: '수학', description: '공통수학의 개념부터 유형 문제까지. 단원과 난이도를 고르고 풀이 여백에 직접 써 보세요.', action: '수학 연습하기', tone: 'info' },
  { id: 'english', title: '영어', description: '단어의 뜻을 떠올리고, 보기에서 고르거나 직접 입력해 보세요. 어려웠던 단어는 기록에서 다시 연습할 수 있어요.', action: '영어 연습하기', tone: 'violet' },
] as const;

export default function Home() {
  return <>
    <section className="home-hero">
      <div className="home-hero-copy">
        <h1>풀림</h1>
        <p className="home-headline">오늘 배운 것을<br />오늘 한 문제로.</p>
        <p>수학은 손으로 풀고, 영어는 기억에서 꺼내 보세요. 틀린 문제에서 다음 연습을 시작할 수 있어요.</p>
        <div className="actions">
          <a className="button primary action-start" href={base + '#/math'}><Icon name="book" />오늘의 학습</a>
          <a className="button secondary" href={base + '#/wall'}><Icon name="post" />담벼락 보기</a>
        </div>
      </div>
      <div className="home-symbols" aria-hidden="true">
        <span><Icon name="math" /></span><span><Icon name="english" /></span>
      </div>
    </section>
    <section className="home-section" aria-labelledby="home-study">
      <h2 id="home-study">무엇을 연습할까요?</h2>
      <div className="subject-grid">
        {subjects.map(subject => <article className="panel subject-card" key={subject.id}>
          <span className="context-chip" data-tone={subject.tone}><Icon name={subject.id} />{subject.title}</span>
          <p>{subject.description}</p>
          <a className="button secondary" data-tone={subject.tone} href={base + '#/' + subject.id}>{subject.action}</a>
        </article>)}
      </div>
    </section>
    <section className="home-section home-tools" aria-label="복습과 공유">
      <article className="panel">
        <h2><Icon name="records" />내 풀이 돌아보기</h2>
        <p>로그인하면 수학과 영어에서 푼 문제를 한곳에서 확인할 수 있어요.</p>
        <a className="plain-button" href={base + '#/records'}>풀이 기록 보기</a>
      </article>
      <article className="panel">
        <h2><Icon name="comment" />함께 풀어 보기</h2>
        <p>담벼락에서 막힌 문제를 질문하거나 다른 사람의 풀이에 댓글을 남겨 보세요.</p>
        <a className="plain-button" href={base + '#/search'}>풀이와 질문 검색</a>
      </article>
    </section>
  </>;
}
