const fs = require('fs');
let txt = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Fix imports
txt = txt.replace(/import \{[\s\S]*?\} from 'recharts';/, "import {\n  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area\n} from 'recharts';");

// Fix user table rows
txt = txt.replace(/<div className="w-10[\s\S]*?\{user\.nome\.charAt\(0\)\}[\s\S]*?<\/div>\s*<div>\s*<p className="text-sm font-bold text-white">\{user\.nome\}<\/p>\s*<p className="text-xs text-gray-500">\{user\.email\}<\/p>\s*<\/div>/g, <div className="w-10 h-10 rounded-full bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center text-premium-gold font-bold">
                                  {(user.nome || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{user.nome || "Desconhecido"}</p>
                                  <p className="text-xs text-gray-500">{user.email || "Sem e-mail"}</p>
                                </div>);

// Fix driver table rows
txt = txt.replace(/\{driver\.nome\.charAt\(0\)\}[\s\S]*?<\/div>\s*<div>\s*<p className="text-sm font-bold text-white">\{driver\.nome\}<\/p>\s*<p className="text-xs text-gray-500">\{driver\.email\}<\/p>/g, {(driver.nome || "D").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{driver.nome || "Desconhecido"}</p>
                            <p className="text-xs text-gray-500">{driver.email || "Sem e-mail"}</p>);

fs.writeFileSync('src/pages/Admin.tsx', txt);
