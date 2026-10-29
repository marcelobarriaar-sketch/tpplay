import { Link } from "react-router-dom";
export default function ValleyWelcome() {
  return (
    <section className="valley-home panel" aria-labelledby="valley-home-title">
      <div>
        <p className="eyebrow">TU CIUDAD. TUS DECISIONES. TU AVENTURA.</p>
        <h2 id="valley-home-title">Bienvenido a Valle del Coihue</h2>
        <p className="valley-lead">
          <em>Entre lagos y volcanes, tu aventura comienza.</em>
        </p>
        <p>
          En el sur de un Chile imaginado, rodeada de bosques de coihues y
          montañas que se reflejan en el lago, existe una ciudad con historias
          por descubrir y desafíos que esperan por ti.
        </p>
        <p>
          En Valle del Coihue, cada vecino tiene algo que compartir y cada lugar
          abre una oportunidad para aprender. Recorre su plaza, entra al
          mercado, conoce a sus emprendedores y descubre cómo funciona una
          comunidad en la que tus decisiones cuentan.
        </p>
        <p>
          Aquí podrás dar tus primeros pasos en el mundo del trabajo, ayudar a
          resolver problemas y convertir una idea en un proyecto. No necesitas
          saberlo todo para comenzar: puedes explorar, preguntar, equivocarte y
          volver a intentarlo.
        </p>
        <p>
          <strong>
            La ciudad te da la bienvenida. ¿Qué descubrirás en tu primera
            misión?
          </strong>
        </p>
        <Link className="button" to="/aventura">
          Explorar la ciudad sin cuenta <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="valley-home-landscape" aria-hidden="true">
        <span>✦</span>
        <strong>
          VALLE
          <br />
          DEL COIHUE
        </strong>
        <small>Entre lagos y volcanes</small>
      </div>
    </section>
  );
}
