const fs = require('fs');
let txt = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regexUser = /<div className="w-10 h-10[^>]*>\s*\{user\.nome\.charAt\(0\)\}\s*<\/div>\s*<div>\s*<p className="text-sm font-bold text-white">\{user\.nome\}<\/p>\s*<p className="text-xs text-gray-500">\{user\.email\}<\/p>\s*<\/div>/g;

const replUser = \<div className="w-10 h-10 rounded-full bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center text-premium-gold font-bold">
                                  {(user.nome || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{user.nome || "Desconhecido"}</p>
                                  <p className="text-xs text-gray-500">{user.email || "Sem e-mail"}</p>
                                </div>\;

txt = txt.replace(regexUser, replUser);

const regexDriver = /<div className="w-10 h-10[^>]*>\s*\{driver\.nome\.charAt\(0\)\}\s*<\/div>\s*<div>\s*<p className="text-sm font-bold text-white">\{driver\.nome\}<\/p>\s*<p className="text-xs text-gray-500">\{driver\.email\}<\/p>\s*<\/div>/g;

const replDriver = \<div className="w-10 h-10 rounded-full bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center text-premium-gold font-bold">
                            {(driver.nome || "D").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{driver.nome || "Desconhecido"}</p>
                            <p className="text-xs text-gray-500">{driver.email || "Sem e-mail"}</p>
                          </div>\;

txt = txt.replace(regexDriver, replDriver);
fs.writeFileSync('src/pages/Admin.tsx', txt);
