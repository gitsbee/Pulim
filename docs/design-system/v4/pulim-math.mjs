/**
 * Render a plain LaTeX string into an existing element with Pulim's KaTeX settings.
 * Supply the KaTeX object from the application. Load katex.min.css once.
 */
export function renderPulimMath(katex, element, latex, { display = false } = {}) {
  element.classList.toggle('pulim-math', display);
  element.classList.toggle('pulim-math-inline', !display);
  try {
    katex.render(latex, element, {
      displayMode: display,
      output: 'htmlAndMathml',
      trust: false,
      strict: 'ignore',
      throwOnError: true,
      maxExpand: 100,
      maxSize: 12,
    });
    element.classList.remove('pulim-error');
    return true;
  } catch (error) {
    if (!(error instanceof katex.ParseError)) throw error;
    element.textContent = '수식을 표시할 수 없습니다.';
    element.classList.add('pulim-error');
    return false;
  }
}
