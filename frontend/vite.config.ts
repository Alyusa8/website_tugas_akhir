import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tailwindcss(), tsconfigPaths()],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify('https://wxvpjellodxhdttlwysn.supabase.co'),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dnBqZWxsb2R4aGR0dGx3eXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTI5MjgsImV4cCI6MjA3Nzc2ODkyOH0.TX2cULDvs8jlYS7Fyu86fa_hiX4PEYFeJOEVVoCYpzU')
  },
  server: {
    port: 5174,
    host: true,
    open: false
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    force: true
  }
});
