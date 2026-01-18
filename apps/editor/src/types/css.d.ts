// Type declarations for CSS modules
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

// Type declarations for framework7 CSS bundle
declare module 'framework7/css/bundle' {}
declare module 'framework7/css/bundle.css' {}
