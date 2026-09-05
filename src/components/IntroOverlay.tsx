export function IntroOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro-backdrop" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <section className="intro-panel">
        <p className="intro-kicker">舞鶴の3D都市で考える</p>
        <h1 id="intro-title">舞鶴が水につかったら！？</h1>
        <p className="intro-question">みんななら、どんな街にする？</p>
        <p className="intro-copy">
          本物の舞鶴の街を見ながら、海の水が上がったときに困る場所と、
          未来に置きたい施設を考えてみよう。
        </p>
        <button type="button" className="intro-start-button" onClick={onStart}>
          まちを見てみる
        </button>
      </section>
    </div>
  );
}
