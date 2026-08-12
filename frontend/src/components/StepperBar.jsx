import React from 'react'

export function StepperBar({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep
        const isPast = index < currentStep
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: isActive ? '#e50914' : '#1e293b',
                color: isActive ? '#fff' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px', zIndex: 2,
                boxShadow: isActive ? '0 0 12px rgba(229,9,20,0.5)' : 'none',
                transition: 'all 0.3s'
              }}>
                {isPast ? '✓' : index + 1}
              </div>
              <span style={{
                position: 'absolute', top: '100%', marginTop: '8px',
                fontSize: '11px', fontWeight: isActive ? 600 : 500,
                color: isActive ? '#e2e8f0' : '#64748b',
                whiteSpace: 'nowrap'
              }}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: isPast ? '#e50914' : '#1e293b', margin: '0 12px', minWidth: '40px', transition: 'all 0.3s' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
