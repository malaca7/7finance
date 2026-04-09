const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
content = content.replace(/import \{\s*BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer[\s\S]*?\} from 'recharts';/m, 
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';);
fs.writeFileSync('src/pages/Admin.tsx', content);
