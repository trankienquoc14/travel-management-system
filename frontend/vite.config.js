import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawBackendUrl = (env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || '').trim();
  
  // Trích xuất duy nhất đường link http/https hợp lệ, loại bỏ mọi văn bản dính kèm
  const urlMatch = rawBackendUrl.match(/https?:\/\/[^\s"'<>]+/i);
  const backendUrl = urlMatch 
    ? urlMatch[0].replace(/\/+$/, '').trim() 
    : '';

  return {
    plugins: [
      {
        name: 'replace-backend-url',
        enforce: 'pre',
        transform(code, id) {
          if (backendUrl && (id.endsWith('.jsx') || id.endsWith('.js') || id.endsWith('.html'))) {
            return {
              code: code
                .replaceAll('http://localhost:5000', backendUrl)
                .replaceAll('http://localhost:5005', backendUrl),
              map: null
            };
          }
        }
      },
      react()
    ]
  };
});
