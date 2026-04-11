/**
 * Script para garantir que TODOS os usuários da tabela users
 * tenham uma conta auth no Supabase com {phone}@7finance.com
 * 
 * Senha padrão: 112233 (para quem não tem auth)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://divecpmkitjqkfyxnfds.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0';

const DEFAULT_PASSWORD = '112233';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔍 Buscando todos os usuários da tabela users...\n');

  const { data: users, error } = await supabaseAdmin.from('users').select('*');
  if (error) { console.error('Erro ao buscar users:', error.message); return; }
  
  console.log(`📋 Total de usuários na tabela: ${users.length}\n`);

  // Lista todos os auth users
  const { data: authListResult, error: authListError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (authListError) { console.error('Erro ao listar auth users:', authListError.message); return; }
  
  const authUsers = authListResult.users;
  console.log(`🔐 Total de auth users: ${authUsers.length}\n`);

  // Mapas para lookup rápido
  const authById = new Map();
  const authByEmail = new Map();
  for (const au of authUsers) {
    authById.set(au.id, au);
    if (au.email) authByEmail.set(au.email.toLowerCase(), au);
  }

  let fixed = 0;
  let alreadyOk = 0;
  let errors = 0;

  for (const user of users) {
    const phone = (user.phone || '').replace(/\D/g, '');
    const expectedEmail = phone ? `${phone}@7finance.com` : null;
    
    console.log(`\n--- Usuário: ${user.name || 'sem nome'} | phone: ${phone || 'N/A'} | auth_id: ${user.auth_id || 'N/A'} ---`);

    // Caso 1: Tem auth_id e existe no auth
    if (user.auth_id && authById.has(user.auth_id)) {
      const authUser = authById.get(user.auth_id);
      
      // Verifica se o email auth bate
      if (expectedEmail && authUser.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
        console.log(`  ⚠️  Email auth é "${authUser.email}" mas deveria ser "${expectedEmail}". Corrigindo...`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
          email: expectedEmail,
          email_confirm: true,
          password: DEFAULT_PASSWORD
        });
        if (updateError) {
          console.log(`  ❌ Erro ao corrigir email: ${updateError.message}`);
          errors++;
        } else {
          console.log(`  ✅ Email corrigido para ${expectedEmail} + senha redefinida para ${DEFAULT_PASSWORD}`);
          fixed++;
        }
      } else {
        // Senha: reset para garantir que funciona
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
          password: DEFAULT_PASSWORD,
          email_confirm: true
        });
        if (pwError) {
          console.log(`  ❌ Erro ao resetar senha: ${pwError.message}`);
          errors++;
        } else {
          console.log(`  ✅ OK (auth existe, senha resetada para ${DEFAULT_PASSWORD})`);
          alreadyOk++;
        }
      }
      continue;
    }

    // Caso 2: Sem auth_id ou auth_id inválido - precisa criar auth
    if (!phone) {
      console.log(`  ⏭️  Sem telefone cadastrado, pulando...`);
      continue;
    }

    // Verifica se já existe auth com esse email
    if (expectedEmail && authByEmail.has(expectedEmail.toLowerCase())) {
      const existingAuth = authByEmail.get(expectedEmail.toLowerCase());
      console.log(`  🔗 Auth com email ${expectedEmail} já existe (id: ${existingAuth.id}). Vinculando...`);
      
      // Atualiza auth_id na tabela users
      const { error: linkError } = await supabaseAdmin.from('users')
        .update({ auth_id: existingAuth.id })
        .eq('id', user.id);
      
      if (linkError) {
        console.log(`  ❌ Erro ao vincular: ${linkError.message}`);
        errors++;
      } else {
        // Reset de senha também
        await supabaseAdmin.auth.admin.updateUserById(existingAuth.id, {
          password: DEFAULT_PASSWORD,
          email_confirm: true
        });
        console.log(`  ✅ Vinculado + senha resetada para ${DEFAULT_PASSWORD}`);
        fixed++;
      }
      continue;
    }

    // Caso 3: Precisa criar nova auth account
    console.log(`  🆕 Criando auth account ${expectedEmail}...`);
    const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: expectedEmail,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: user.name }
    });

    if (createError) {
      console.log(`  ❌ Erro ao criar auth: ${createError.message}`);
      errors++;
      continue;
    }

    // Vincula auth_id
    const { error: linkError } = await supabaseAdmin.from('users')
      .update({ auth_id: newAuth.user.id })
      .eq('id', user.id);

    if (linkError) {
      console.log(`  ❌ Auth criado mas erro ao vincular: ${linkError.message}`);
      errors++;
    } else {
      console.log(`  ✅ Auth criado e vinculado! (${expectedEmail} / ${DEFAULT_PASSWORD})`);
      fixed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESULTADO FINAL:`);
  console.log(`   ✅ Já OK / senha resetada: ${alreadyOk}`);
  console.log(`   🔧 Corrigidos/Criados: ${fixed}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📱 Total processados: ${users.length}`);
  console.log(`\n🔑 Senha padrão para todos: ${DEFAULT_PASSWORD}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
