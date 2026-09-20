// Configuração Supabase — as chaves abaixo são públicas por design (client-side).
// O URL pode ser trocado a qualquer momento; a chave 'anon' é a JWT clássica de leitura.
// NOTA: a service_role / sb_secret NUNCA é colocada aqui (não vai para o browser).

export const SUPABASE_URL = 'https://qsohbmjdhwjgizdfowfk.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzb2hibWpkaHdqZ2l6ZGZvd2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDgxODIsImV4cCI6MjEwNTQ4NDE4Mn0.aAvqeQNKGuza57ah4QK-3w-1yDTWbJMOoDWvzt9ug-g';

// Publishable key (alternativa equivalente ao anon nas APIs REST):
// 'sb_publishable_tDOpM2ATo4NFBZDYflc-Bw_ysQ7mNng'