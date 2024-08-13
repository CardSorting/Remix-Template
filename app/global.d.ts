// Declare module for CSS files to handle imports in TypeScript
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Optionally, declare modules for other file types if needed
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

// Example for JSON files
declare module '*.json' {
  const value: any;
  export default value;
}

// Example for other static assets if needed (e.g., videos, fonts)
declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.woff' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}