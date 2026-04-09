const fs = require('fs');
let text = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
text = text.replace(/import\s*\{\s*BarChart[\s\S]*?from 'recharts';/, ""import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';"");
fs.writeFileSync('src/pages/Admin.tsx', text);
