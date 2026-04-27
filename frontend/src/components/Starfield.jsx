import React, { useMemo } from 'react';

const StarLayer = ({ count, size, duration, color, opacity }) => {
  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
    }));
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <div
          key={`${size}-${star.id}`}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: size,
            height: size,
            background: color,
            opacity: opacity,
            '--duration': duration,
            animationDelay: star.delay,
          }}
        />
      ))}
    </>
  );
};

const Starfield = () => {
  return (
    <div className="starfield">
      {/* Background nebulas - CSS subtle glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(123, 97, 255, 0.05) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: -2
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(77, 238, 234, 0.03) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: -2
      }} />

      {/* Distant Stars */}
      <StarLayer count={100} size="1px" duration="4s" color="#fff" opacity={0.2} />
      {/* Mid Stars */}
      <StarLayer count={50} size="2px" duration="6s" color="#fff" opacity={0.4} />
      {/* Accent Stars */}
      <StarLayer count={20} size="1.5px" duration="3s" color="#4deeea" opacity={0.3} />
    </div>
  );
};

export default Starfield;
