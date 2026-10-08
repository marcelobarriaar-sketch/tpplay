export default function Campus() {
  return <div className="campus" aria-hidden="true">
    <img src="/images/campus-los-lagos.webp" srcSet="/images/campus-los-lagos-small.webp 960w, /images/campus-los-lagos.webp 1672w" sizes="100vw" width="1672" height="941" alt="" fetchPriority="high"/>
    <span className="campus-label campus-admin">◈ Gestión y emprendimiento</span>
    <span className="campus-label campus-agro">✳ Agropecuaria</span>
    <span className="campus-label campus-parvulos">♡ Atención de párvulos</span>
  </div>;
}
