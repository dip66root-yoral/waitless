import { useState } from 'react'

export function CinemaPoster({ movie, style = {} }) {
  const { poster } = movie
  const renderPattern = () => {
    switch (poster.pattern) {
      case 'web':
        return (
          <>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.12 }} viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
              {[...Array(14)].map((_,i) => <line key={i} x1="380" y1="580" x2={i*30} y2="0" stroke={poster.accent} strokeWidth="0.9"/>)}
              {[80,160,240,320,400].map(r => <circle key={r} cx="380" cy="580" r={r} fill="none" stroke={poster.accent} strokeWidth="0.8"/>)}
            </svg>
            <div style={{ position:'absolute', bottom:'-30px', right:'-30px', width:'280px', height:'280px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}30 0%, transparent 65%)` }}/>
            <div style={{ position:'absolute', top:'-20px', left:'-20px', width:'160px', height:'160px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}20 0%, transparent 65%)` }}/>
          </>
        )
      case 'stars':
        return (
          <>
            {[...Array(80)].map((_,i) => (
              <div key={i} style={{ position:'absolute', borderRadius:'50%', background:'var(--text-main)', width: i%5===0?'2.5px':i%3===0?'1.5px':'1px', height: i%5===0?'2.5px':i%3===0?'1.5px':'1px', left:`${(i*41+7)%100}%`, top:`${(i*67+13)%100}%`, opacity: 0.08+(i%7)*0.07 }}/>
            ))}
            <div style={{ position:'absolute', top:'15%', right:'12%', width:'100px', height:'100px', borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, ${poster.accent}50 0%, ${poster.accent}15 50%, transparent 70%)`, boxShadow:`0 0 40px ${poster.accent}35`}}/>
            <div style={{ position:'absolute', top:'20%', left:'25%', width:'220px', height:'140px', borderRadius:'50%', background:`radial-gradient(ellipse, ${poster.accent2}15 0%, transparent 70%)` }}/>
          </>
        )
      case 'fire':
        return (
          <>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'60%', background:`linear-gradient(to top, ${poster.accent}45 0%, ${poster.accent2}20 40%, transparent 100%)` }}/>
            <div style={{ position:'absolute', bottom:'-40px', left:'50%', transform:'translateX(-50%)', width:'400px', height:'250px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}25 0%, transparent 65%)` }}/>
            {['-12deg','-6deg','0deg','6deg'].map((r,i) => (
              <div key={i} style={{ position:'absolute', top:'5%', left:'-30%', width:'160%', height:'2px', background:`linear-gradient(90deg,transparent,${poster.accent}${40-i*8},transparent)`, transform:`rotate(${r})` }}/>
            ))}
          </>
        )
      case 'dust':
        return (
          <>
            {[...Array(24)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width: i%4===0?'4px':'2px', height: i%4===0?'4px':'2px', borderRadius:'50%', background:poster.accent, left:`${(i*47+11)%100}%`, top:`${(i*73+17)%100}%`, opacity:0.08+(i%5)*0.07 }}/>
            ))}
            <div style={{ position:'absolute', bottom:'-50px', left:'50%', transform:'translateX(-50%)', width:'420px', height:'300px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent}22 0%, transparent 60%)` }}/>
          </>
        )
      case 'biolum':
        return (
          <>
            {[...Array(30)].map((_,i) => (
              <div key={i} style={{ position:'absolute', width:'5px', height:'5px', borderRadius:'50%', background:i%2===0?poster.accent:poster.accent2, left:`${(i*43+9)%100}%`, top:`${(i*71+15)%100}%`, opacity:0.1+(i%6)*0.06, boxShadow:`0 0 8px ${i%2===0?poster.accent:poster.accent2}` }}/>
            ))}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 45% 85% at 10% 60%, ${poster.accent}15 0%, transparent 55%)` }}/>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 40% 70% at 90% 40%, ${poster.accent2}12 0%, transparent 55%)` }}/>
            <div style={{ position:'absolute', bottom:'-30px', right:'15%', width:'200px', height:'200px', borderRadius:'50%', background:`radial-gradient(circle, ${poster.accent2}28 0%, transparent 65%)` }}/>
          </>
        )
      default: return null
    }
  }
  return (
    <div style={{ position:'absolute', inset:0, background:poster.bg, overflow:'hidden', ...style }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 40% 30%, ${poster.accent}22 0%, transparent 60%)` }}/>
      {renderPattern()}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9rem', opacity:0.1, transform:'rotate(-8deg) scale(1.15)', userSelect:'none', pointerEvents:'none', filter:`drop-shadow(0 0 40px ${poster.accent}60)` }}>
        {poster.emoji}
      </div>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,transparent,${poster.accent},transparent)` }}/>
    </div>
  )
}

export function MoviePoster({ movie, style = {} }) {
  const [imgStatus, setImgStatus] = useState('loading')

  if (!movie.posterUrl || imgStatus === 'error') {
    return <CinemaPoster movie={movie} style={style} />
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      {imgStatus === 'loading' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear'
        }} />
      )}
      <img 
        src={movie.posterUrl} 
        alt={movie.title}
        onLoad={() => setImgStatus('loaded')}
        onError={() => setImgStatus('error')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: movie.poster?.objectPosition || 'center',
          opacity: imgStatus === 'loaded' ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  )
}

export function PosterThumb({ movie, size = 80 }) {
  return (
    <div style={{ width:`${size}px`, height:`${Math.round(size*1.45)}px`, borderRadius:'10px', overflow:'hidden', position:'relative', flexShrink:0, border:`1px solid ${movie.poster.accent}35` }}>
      <MoviePoster movie={movie} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }}/>
    </div>
  )
}
