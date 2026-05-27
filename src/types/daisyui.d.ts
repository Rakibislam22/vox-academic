declare module 'daisyui' {
  const plugin: NonNullable<import('tailwindcss').Config['plugins']>[number];
  export default plugin;
}
