export default function Campus() {
  return <div className="campus" role="img" aria-label="Campus ilustrado: invernadero, taller de Administración y espacio de Párvulos, conectados en un paisaje del sur de Chile">
    <div className="campus-orbit orbit-one"/><div className="campus-orbit orbit-two"/>
    <svg viewBox="0 0 720 620" aria-hidden="true">
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3D857D"/><stop offset="1" stopColor="#17465C"/></linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#57CFD1" stopOpacity=".65"/><stop offset="1" stopColor="#292875"/></linearGradient>
        <linearGradient id="mount" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#C4D9E4"/><stop offset="1" stopColor="#344863"/></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#B9F4D0"/><stop offset="1" stopColor="#499B91"/></linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="20" stdDeviation="22" floodColor="#000" floodOpacity=".35"/></filter>
      </defs>
      <circle cx="529" cy="117" r="55" fill="#9DAEFF" opacity=".16"/><circle cx="529" cy="117" r="33" fill="#D5D6FF" opacity=".5"/>
      <path d="M64 250L192 85l112 158 78-119 159 129 75-92 63 151Z" fill="url(#mount)" opacity=".65"/>
      <path d="M161 126l31-41 43 61-33-12-17 8Z" fill="#E0E8EF"/><path d="M351 172l31-48 60 49-45-12-16 16Z" fill="#E0E8EF" opacity=".7"/>
      <ellipse cx="367" cy="488" rx="305" ry="78" fill="#6746CC" opacity=".12"/>
      <g filter="url(#shadow)">
        <path d="M60 310q-12-66 71-93l265-37q96-10 187 58l74 66q53 66-21 111L387 529q-72 31-146-13L92 408q-38-27-32-98" fill="#123445"/>
        <path d="M60 303q-12-66 71-93l265-37q96-10 187 58l74 66q53 53-21 98L387 502q-72 31-146-13L92 381q-38-27-32-78" fill="url(#land)"/>
        <path d="M74 308q112-14 166 80t152 86q82 0 154-52" fill="none" stroke="url(#water)" strokeWidth="26"/>
        <path d="M173 281l119 63 124-73 101 66" fill="none" stroke="#D9DAAD" strokeWidth="14" strokeLinecap="round"/>
        <path d="M292 344l47 47 69-11" fill="none" stroke="#D9DAAD" strokeWidth="10" strokeLinecap="round"/>
        <g transform="translate(155 205)">
          <path d="M0 47L63 10l86 47-64 38Z" fill="#D6EFE4"/><path d="M0 47v61l85 48V95Z" fill="#7DAAAF"/><path d="M85 95l64-38v61l-64 38Z" fill="#507786"/>
          <path d="M-8 44L60 0l94 52-67 42Z" fill="#A5B9ED"/><path d="M14 73l15 8v23l-15-8m22-11l16 9v23l-16-9m70-4l18-11v23l-18 11" fill="#D2EFA0"/>
          <path d="M56 97l20 12v39l-20-12Z" fill="#344B68"/>
        </g>
        <g transform="translate(403 215)">
          <path d="M0 55l50-40 86 46-50 39Z" fill="url(#glass)"/><path d="M0 55v48l86 46v-49Z" fill="#90C9AD"/><path d="M86 100l50-39v49l-50 39Z" fill="#4F978D"/>
          <path d="M0 55l24-52 26 12 86 46-22-50L24 3m0 0l86 46 26 12M24 3v64m27-32v46m28-31v46M0 103l86 46" fill="none" stroke="#DDF5DB" strokeWidth="4"/>
          <path d="M14 96l51 26m-51-39l51 27" stroke="#326F4D" strokeWidth="7"/>
        </g>
        <g transform="translate(339 339)">
          <path d="M0 27l45-26 74 41-45 25Z" fill="#EDC2B3"/><path d="M0 27v53l74 40V67Z" fill="#BD858B"/><path d="M74 67l45-25v53l-45 25Z" fill="#825B80"/>
          <path d="M-5 25L42-9l83 48-48 31Z" fill="#8A76B6"/><path d="M15 53l16 9v23l-16-9m23-11l16 9v23l-16-9m45-5l16-9v25l-16 9" fill="#FFE5AF"/>
        </g>
        {[ [105,270],[122,248],[326,216],[568,313],[584,329],[265,407],[226,365],[480,404],[495,420] ].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0 4v28" stroke="#836F63" strokeWidth="5"/><path d="M0-40L-20 3h11L-24 20h48L9 3h11Z" fill={i%2?'#34785F':'#235F58'}/></g>)}
        <path d="M255 371l35-21 21 11-35 21Z" fill="#9CA58B"/><path d="M256 378l33-20 24 13-34 20Z" fill="#A7B7A1"/>
      </g>
      <g fill="#CEFF55"><circle cx="303" cy="321" r="5"/><circle cx="385" cy="289" r="4"/><circle cx="465" cy="306" r="4"/></g>
      <g fill="#A9B3DB" opacity=".6"><circle cx="114" cy="99" r="2"/><circle cx="397" cy="67" r="2"/><circle cx="626" cy="185" r="2"/><circle cx="86" cy="185" r="2"/></g>
    </svg>
    <span className="campus-label campus-admin">◈ Administración</span><span className="campus-label campus-agro">✳ Agropecuaria</span><span className="campus-label campus-parvulos">♡ Párvulos</span>
    <div className="campus-note"><span className="live-dot"/> Un campus. Muchas formas de aprender.</div>
  </div>;
}
