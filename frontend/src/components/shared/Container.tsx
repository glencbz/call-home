import React from 'react';
import MuContainer from '@material-ui/core/Container';

document.documentElement.style.setProperty(
  '--viewport-height',
  `${window.innerHeight}px`
);
window.addEventListener('resize', () => {
  document.documentElement.style.setProperty(
    '--viewport-height',
    `${window.innerHeight}px`
  );
});

const CONTAINER_STYLES: React.CSSProperties = {
  // Mad hacks
  height: '1px',
  minHeight: 'var(--viewport-height)',
  padding: '5% 5%',
  paddingTop: '3em',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
};

export default function Container({
  children,
  style,
  ...rest
}: {
  children: JSX.Element | JSX.Element[];
  style?: React.CSSProperties;
}) {
  const containerStyles = style
    ? {
        ...CONTAINER_STYLES,
        ...style,
      }
    : CONTAINER_STYLES;
  return (
    <MuContainer style={containerStyles} {...rest} maxWidth="sm">
      {children}
    </MuContainer>
  );
}
