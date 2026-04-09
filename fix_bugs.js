const fs = require('fs');
let txt = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// 1. Corrigir caracteres especiais nas opções (UTF-8)
txt = txt.replace(/label: 'UsuÃ¡rio'/g, \"label: 'Usuário'\");

// 2. Corrigir renderização do usuário na tabela (Evitar erro se for null)
txt = txt.replace(
    /<div className=\"w-10 h-10 rounded-full bg-premium-gold\/10 border border-premium-gold\/20 flex items-center\\s*justify-center text-premium-gold font-bold\">\\s*\\{user\\.nome\\.charAt\\(0\\)\\}\\s*<\\/div>\\s*<div>\\s*<p className=\"text-sm font-bold text-white\">\\{user\\.nome\\}<\\/p>\\s*<p className=\"text-xs text-gray-500\">\\{user\\.email\\}<\\/p>\\s*<\\/div>/g,
    \<div className=\"w-10 h-10 rounded-full bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center text-premium-gold font-bold\">
                                  {(user.nome || \"U\").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className=\"text-sm font-bold text-white\">{user.nome || \"Desconhecido\"}</p>
                                  <p className=\"text-xs text-gray-500\">{user.email || \"Sem e-mail\"}</p>
                                </div>\
);

// 3. Corrigir renderização do motorista nos Top Drivers (Evitar erro se for null)
txt = txt.replace(
    /border-premium-gold\/20\">\\s*\\{driver\\.nome\\.charAt\\(0\\)\\}\\s*<\\/div>\\s*<div>\\s*<p className=\"text-sm font-bold text-white\">\\{driver\\.nome\\}<\\/p>\\s*<p className=\"text-xs text-gray-500\">\\{driver\\.email\\}<\\/p>/g,
    \order-premium-gold/20\">
                            {(driver.nome || \"D\").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className=\"text-sm font-bold text-white\">{driver.nome || \"Desconhecido\"}</p>
                            <p className=\"text-xs text-gray-500\">{driver.email || \"Sem e-mail\"}</p>\
);

// 4. Corrigir lógica de filtragem para evitar crashes com campos nulos
txt = txt.replace(
    /return allUsers\\.filter\\(user => \\{\\s*const matchesSearch =\\s*user\\.nome\\.toLowerCase\\(\\)\\.includes\\(searchTerm\\.toLowerCase\\(\\)\\) \\|\\|/g,
    \eturn allUsers.filter(user => {
        const matchesSearch =
          (user.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||\
);

fs.writeFileSync('src/pages/Admin.tsx', txt);
