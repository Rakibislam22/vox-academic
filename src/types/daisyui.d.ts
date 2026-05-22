import type { Config } from 'tailwindcss';

declare module 'daisyui' {
    const plugin: NonNullable<Config['plugins']>[number];
    export default plugin;
}