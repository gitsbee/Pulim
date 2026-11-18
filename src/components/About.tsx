import { base } from '../hooks/useNavigation';

export default function About() {
  return <article className="about panel">
    <h2>함께 푸는 학습 공간</h2>
    <p>풀림에서 수학과 영어를 연습하고, 담벼락에서 풀이와 질문을 나눌 수 있어요.</p>
    <h2>오늘의 문제</h2>
    <p>수학 화면의 오늘의 학습에서 문제공방이 학습 범위와 복습 기록을 바탕으로 준비한 문제를 풀 수 있어요.</p>
    <h2>내 기록</h2>
    <p>한 계정으로 수학과 영어 풀이 기록을 확인하세요. 연습 중인 문제와 필기는 사용하던 브라우저에 남습니다.</p>
    <h2>담벼락</h2>
    <p>글과 댓글은 전체 공개입니다. 게시물에 좋아요와 싫어요를 표시하거나, 글을 덧붙여 리포스트할 수 있어요.
      개인정보가 담긴 내용은 올리지 말고 서로의 풀이를 존중해 주세요.</p>
    <a className="button primary" href={base}>풀림으로 돌아가기</a>
  </article>;
}
