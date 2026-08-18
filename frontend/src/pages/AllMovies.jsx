import { Link } from 'react-router-dom'
import { MOVIES } from '../data/movies.js'
import { MoviePoster } from '../components/MoviePoster.jsx'

export default function AllMovies() {
  return (
    <div className="app-bg" style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="responsive-padding" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 28px' }}>
        
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, color: 'var(--text-main)', fontSize: '32px', marginBottom: '8px' }}>
              All Movies
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Browse all movies currently playing in cinemas near you.
            </p>
          </div>
          <Link to="/" style={{ textDecoration: 'none', color: '#e50914', fontWeight: 600, fontSize: '14px', background: 'rgba(229,9,20,0.1)', padding: '8px 16px', borderRadius: '20px' }}>
            ← Back to Home
          </Link>
        </div>

        <div className="responsive-movie-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '24px' 
        }}>
          {MOVIES.map(movie => (
            <Link 
              key={movie.id} 
              to={`/movie/${movie.id}`} 
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '1/1.45',
                border: `1px solid rgba(var(--rgb-white),0.08)`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${movie.poster.accent}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
              }}>
                <MoviePoster movie={movie} />
                
                {/* Gradient Overlay for Text Readability */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Text Content */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>⭐ {movie.imdb}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {movie.duration}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text-main)', lineHeight: 1.1, margin: 0 }}>
                    {movie.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {movie.genre.join(' · ')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
