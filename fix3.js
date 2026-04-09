const fs = require('fs');
let txt = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
txt = txt.replace(/import\s*\{\s*BarChart[\s\S]*?from 'recharts';/, "" +
"import {\n  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area\n} from 'recharts';");
fs.writeFileSync('src/pages/Admin.tsx', txt);
